import * as express from 'express';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { NextFunction, Request, Response } from 'express';
import * as cron from 'node-cron';
import { Config, CronJobRouteV2, HttpRouteV2, SqsRouteV2 } from './core/config';
import { Logger } from '../logger';
import * as winston from 'winston';
import { randomUUID } from 'crypto';
import { sessionContext } from './core/session-context';
import { get } from 'lodash';

export class App {
  readonly registeredHttpHandlers: string[] = [];
  readonly registeredSqsHandlers: string[] = [];
  readonly registeredCronJobHandlers: string[] = [];

  private constructor(
    private readonly expressApp: express.Application,
    private readonly sqsClient: SQSClient,
    readonly logger: winston.Logger,
  ) {}

  static start(
    config: Config,
    expressApp: express.Application,
    sqsClient: SQSClient,
  ): App {
    const port = process.env.SERVICE_PORT ?? 3000;
    const app = new App(
      expressApp,
      sqsClient,
      Logger.instance({
        service: config.service,
        stage: config.stage,
      }),
    );

    app.expressApp.use(express.json());

    this.registerHttpRouteHandlers(app, config.httpRoutes);
    this.registerSqsQueueRouteHandlers(app, config.sqsQueueRoutes);
    this.registerCronJobHandlers(app, config.cronJobRoutes);

    app.logger.info('Register handlers', [
      ...app.registeredHttpHandlers,
      ...app.registeredSqsHandlers,
      ...app.registeredCronJobHandlers,
    ]);

    app.expressApp.listen(port, () => {
      app.logger.info(`Server is running on port ${port}`);
    });

    return app;
  }

  private static registerHttpRouteHandlers(
    app: App,
    routes: HttpRouteV2[],
  ): void {
    routes.forEach((route) => {
      const routeMethod = route.method.toLowerCase();
      const allowedMethods = ['get', 'post', 'put', 'patch', 'delete'];

      if (!allowedMethods.includes(routeMethod)) {
        app.logger.error('Invalid HTTP method', { routeMethod });

        return;
      }

      app.expressApp[routeMethod](
        route.path,
        async (req: Request, res: Response, next: NextFunction) => {
          const correlationId = get(
            req.headers,
            'x-correlation-id',
            randomUUID(),
          );

          sessionContext.run({ correlationId }, async () => {
            const logger = app.logger.child({
              handler: route.handler.name,
              path: route.path,
              correlationId,
            });

            try {
              logger.info('HTTP handler triggered.');

              const handler = new route.handler(logger, req, res);
              const response = await handler.execute();

              logger.info('HTTP handler completed.');

              return response;
            } catch (err) {
              logger.error('Error:', err);

              next(err);
            }
          });
        },
      );

      app.expressApp.use((err, req, res, next) => {
        const logger = app.logger.child({
          handler: route.handler.name,
          path: route.path,
          correlationId: req.headers['x-correlation-id'],
        });

        logger.error('Error:', err);

        res.status(500).json({ error: 'Internal Server Error' });

        next();
      });

      app.registeredHttpHandlers.push(route.handler.name);
    });
  }

  private static registerCronJobHandlers(
    app: App,
    routes: CronJobRouteV2[],
  ): void {
    routes.forEach((route) => {
      cron.schedule(route.cronInterval, async () => {
        const logger = app.logger.child({
          handler: route.handler.name,
          correlationId: randomUUID(),
        });
        const handlerClass = new route.handler(logger);

        try {
          logger.info('Cronjob triggered...');

          await handlerClass.execute();

          logger.info('Cronjob completed.');
        } catch (e) {
          logger.error('Error:', e);
        }
      });

      app.registeredCronJobHandlers.push(route.handler.name);
    });
  }

  private static registerSqsQueueRouteHandlers(
    app: App,
    routes: SqsRouteV2[],
  ): void {
    routes.forEach((route) => {
      const parentLogger = app.logger.child({
        queue: {
          queueUrl: route.queueUrl,
          deadLetterQueueUrl: route.deadLetterQueueUrl,
        },
      });

      cron.schedule(route.cronInterval, async () => {
        parentLogger.info('Polling SQS queue: ' + route.queueUrl);

        try {
          const { Messages } = await app.sqsClient.send(
            new ReceiveMessageCommand({
              QueueUrl: route.queueUrl,
              MaxNumberOfMessages: 10,
              VisibilityTimeout: 300,
            }),
          );
          const messagesProcessed = [];

          parentLogger.info(`${Messages?.length ?? 0} messages received.`);

          if (!Messages) {
            return;
          }

          for (const message of Messages) {
            const logger = parentLogger.child({
              handler: route.handler.name,
              correlationId: message.MessageId ?? randomUUID(),
              messageId: message.MessageId,
              message: message,
            });
            const handlerClass = new route.handler(logger);

            try {
              logger.info('SQS handler triggered.');

              await handlerClass.execute(JSON.parse(message.Body));

              messagesProcessed.push(message);

              logger.info('SQS handler completed.');
            } catch (e) {
              logger.error('Error:', e);

              await app.sqsClient.send(
                new SendMessageCommand({
                  QueueUrl: route.deadLetterQueueUrl,
                  MessageBody: message.Body,
                }),
              );
            } finally {
              logger.info('Deleting message from queue.');

              await app.sqsClient.send(
                new DeleteMessageCommand({
                  QueueUrl: route.queueUrl,
                  ReceiptHandle: message.ReceiptHandle,
                }),
              );
            }
          }

          parentLogger.info(`${messagesProcessed.length} messages processed.`);
        } catch (err) {
          parentLogger.error('Error:', err);
        }
      });

      app.registeredSqsHandlers.push(route.handler.name);
    });
  }
}

import { App } from './app';
import {
  CronJobHandlerV2,
  HttpRequestHandlerV2,
  SqsMessage,
  SqsMessageHandlerV2,
} from './core/handlers';
import * as express from 'express';
import { SQSClient } from '@aws-sdk/client-sqs';

jest.mock('node-cron');

describe('App', function () {
  class ExampleHttpHandler extends HttpRequestHandlerV2<any> {
    execute(): Promise<any> {
      return Promise.resolve(undefined);
    }
  }

  class ExampleSqsHandler extends SqsMessageHandlerV2<void> {
    execute(message: SqsMessage): Promise<void> {
      return Promise.resolve(undefined);
    }
  }
  class ExampleCronJobHandler extends CronJobHandlerV2<void> {
    execute(): Promise<void> {
      return Promise.resolve(undefined);
    }
  }

  test('should return an instance of the app', () => {
    const mockedExpressApp = {
      use: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      listen: jest.fn(),
    } as unknown as jest.Mocked<express.Application>;
    const mockedSqsClient = {} as unknown as jest.Mocked<SQSClient>;

    const app = App.start(
      {
        service: 'example',
        stage: 'local',
        httpRoutes: [
          {
            path: '/example',
            method: 'GET',
            handler: ExampleHttpHandler,
          },
        ],
        sqsQueueRoutes: [
          {
            queueUrl: 'https://example.com',
            deadLetterQueueUrl: 'https://example.com',
            cronInterval: '*/10 * * * * *',
            handler: ExampleSqsHandler,
          },
        ],
        cronJobRoutes: [
          {
            cronInterval: '*/10 * * * * *',
            handler: ExampleCronJobHandler,
          },
        ],
      },
      mockedExpressApp,
      mockedSqsClient,
    );

    expect(app).toBeInstanceOf(App);
    expect(app.logger).toBeDefined();

    expect(app.registeredHttpHandlers).toContain(ExampleHttpHandler.name);
    expect(app.registeredHttpHandlers).not.toContain(ExampleSqsHandler.name);
    expect(app.registeredHttpHandlers).not.toContain(
      ExampleCronJobHandler.name,
    );

    expect(app.registeredSqsHandlers).toContain(ExampleSqsHandler.name);
    expect(app.registeredSqsHandlers).not.toContain(ExampleHttpHandler.name);
    expect(app.registeredSqsHandlers).not.toContain(ExampleCronJobHandler.name);

    expect(app.registeredCronJobHandlers).toContain(ExampleCronJobHandler.name);
    expect(app.registeredCronJobHandlers).not.toContain(
      ExampleHttpHandler.name,
    );
    expect(app.registeredCronJobHandlers).not.toContain(ExampleSqsHandler.name);
  });
});

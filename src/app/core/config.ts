import { App } from '../app';
import {
  CronJobHandler,
  CronJobHandlerV2,
  HttpRequestHandler,
  HttpRequestHandlerV2,
  SqsMessageHandler,
  SqsMessageHandlerV2,
} from './handlers';
import { LoggerInstance } from 'src/logger';
import { Request, Response } from 'express';

export type SqsRoute = {
  queueUrl: string;
  deadLetterQueueUrl: string;
  cronInterval: string; // e.g. '*/10 * * * * *', i.e every 10 seconds
  handler: new (app: App) => SqsMessageHandler<any>;
};

export type SqsRouteV2 = {
  queueUrl: string;
  deadLetterQueueUrl: string;
  cronInterval: string; // e.g. '*/10 * * * * *', i.e every 10 seconds
  handler: new (logger: LoggerInstance) => SqsMessageHandlerV2<any>;
};

export type CronJobRoute = {
  cronInterval: string; // e.g. '*/10 * * * * *', i.e every 10 seconds
  handler: new (app: App) => CronJobHandler<any>;
};

export type CronJobRouteV2 = {
  cronInterval: string; // e.g. '*/10 * * * * *', i.e every 10 seconds
  handler: new (logger: LoggerInstance) => CronJobHandlerV2<any>;
};

export type HttpRoute = {
  method: string;
  path: string;
  handler: new (app: App) => HttpRequestHandler<any>;
};

export type HttpRouteV2 = {
  method: string;
  path: string;
  handler: new (
    logger: LoggerInstance,
    req: Request,
    res: Response,
  ) => HttpRequestHandlerV2<any>;
};

export type Config = {
  // the name of the service
  service: string;
  // the stage where the app is being deployed
  stage: string;
  // the http routes
  httpRoutes: HttpRouteV2[];
  // the sqs queues to listen for
  sqsQueueRoutes: SqsRouteV2[];
  // the cron jobs to run
  cronJobRoutes: CronJobRouteV2[];
};

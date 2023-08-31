import { Request, Response } from 'express';
import { App } from '../app';
import { LoggerInstance } from 'src/logger';

export type SqsMessage = Record<string, any>;

export interface RequestHandler<T> {
  readonly app: App;

  execute(...args: any): Promise<T>;
}

export abstract class HttpRequestHandler<T> implements RequestHandler<T> {
  constructor(readonly app: App) {}

  abstract execute(req: Request, res: Response): Promise<T>;
}

export abstract class HttpRequestHandlerV2<T> {
  constructor(
    readonly logger: LoggerInstance,
    readonly req: Request,
    readonly res: Response,
  ) {}

  abstract execute(): Promise<T>;
}

export abstract class SqsMessageHandler<T> implements RequestHandler<T> {
  constructor(readonly app: App) {}

  abstract execute(message: SqsMessage): Promise<T>;
}

export abstract class SqsMessageHandlerV2<T> {
  constructor(readonly logger: LoggerInstance) {}

  abstract execute(message: SqsMessage): Promise<T>;
}

export abstract class CronJobHandler<T> implements RequestHandler<T> {
  constructor(readonly app: App) {}

  abstract execute(): Promise<T>;
}

export abstract class CronJobHandlerV2<T> {
  constructor(readonly logger: LoggerInstance) {}

  abstract execute(): Promise<T>;
}

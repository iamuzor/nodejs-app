import * as winston from 'winston';

export type LoggerConfig = {
  service?: string;
  stage?: string;
  level?: 'info' | 'error' | 'warn';
};

export type LoggerInstance = winston.Logger;

export class Logger {
  private static logger: LoggerInstance;

  static instance(config: LoggerConfig = {}): LoggerInstance {
    if (!this.logger) {
      this.logger = winston.createLogger({
        level: config?.level ?? 'info',
        format: winston.format.json(),
        defaultMeta: {
          service:
            config.service ?? process.env.SERVICE_NAME ?? process.env.APP_NAME,
          stage: config.stage ?? process.env.STAGE,
        },
        transports: [new winston.transports.Console()],
      });
    }

    return this.logger;
  }
}

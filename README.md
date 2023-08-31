## What?
With this project you can quickly setup an express server with;
- HTTP handlers
- SQS queue handlers
- CronJob handlers

## Usage
In your main entry file, add the following code:
```ts
import { App, HttpRequestHandlerV2 } from 'uzor-app-nodejs';
import { SQSClient } from '@aws-sdk/client-sqs';
import * as express from 'express';

/**
 * Example of a HTTP handler
 */
class HealthCheck extends HttpRequestHandlerV2<any> {
  async execute(): Promise<any> {
    this.logger.info('Health check triggered!');

    this.res.status(200).json({
      message: 'Hello world',
      date: new Date(),
    });
  }
}

/**
 * Example SQS queue handler
 */
export class HelloWorld extends SqsMessageHandlerV2<void> {
  async execute(message: {name: string}): Promise<void> {
    this.logger.info('Hello world triggered!');
  }  
}

/**
 * Start the app
 */
App.start({
  service: 'example',
  stage: 'local',
  httpRoutes: [
    {
      path: '/health-check',
      method: 'GET',
      handler: HealthCheck,
    },
  ],
  sqsQueueRoutes: [
    {
      queueUrl: 'https://example.com',
      deadLetterQueueUrl: 'https://example.com',
      cronInterval: '*/10 * * * * *', // queue is polled at interval
      handler: HelloWorld,
    },
  ],
}, express(), new SQSClient({}))
```

## Why?
I created this package to help me with my projects. I was tired of creating the same thing over and over again across different projects and having to maintain them across all microservices when I needed to make a change. 

This package is a work in progress and I will be adding more features as I need be.
# @framble/nodejs

A package to help you with nodejs projects. With this package you can setup an Express server. It allows you to;
* It can be used to quickly setup APIs
* Setup consumers for SQS queues.

### Usage
Install the package
```bash
npm install @framble/nodejs
```

Create a file called `server.ts` and add the following code:
```ts
import { App } from '@framble/nodejs';
import { HttpHandler } from '../../../src/express-app/core/http-handler';
import { Request, Response } from 'express';

/**
 * Example of a HTTP handler
 */
class HelloWorld extends HttpRequestHandler<void> {
  execute(req: express.Request, res: express.Response): Promise<void> {
    res.send('Hello World');
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
})
```

## Why?
I created this package to help me with my projects. I was tired of creating the same thing over and over again across different projects and having to maintain them across all microservices when I needed to make a change. 

This package is a work in progress and I will be adding more features as I need them.
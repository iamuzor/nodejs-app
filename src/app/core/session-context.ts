import { AsyncLocalStorage } from 'async_hooks';

export const sessionContext = new AsyncLocalStorage<{
  correlationId?: string;
}>();

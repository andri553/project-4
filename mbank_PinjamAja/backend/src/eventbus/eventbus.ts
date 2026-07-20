import { EventEmitter } from 'events';
import { logger } from '../logger/logger';

class EventBus extends EventEmitter {
  publish(event: string, payload: any) {
    logger.debug({ event, payload }, `[EventBus] Publishing event: ${event}`);
    this.emit(event, payload);
  }
}

export const eventBus = new EventBus();

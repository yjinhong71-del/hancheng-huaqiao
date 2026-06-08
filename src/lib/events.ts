import { EventEmitter } from 'events';

// Global singleton EventEmitter for SSE message broadcasting
const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export function getEmitter() {
  return emitter;
}

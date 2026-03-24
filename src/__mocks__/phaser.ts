/**
 * Lightweight Phaser mock for unit testing.
 * Only stubs the APIs actually used by non-visual systems
 * (primarily Phaser.Events.EventEmitter via EventBus).
 */

class EventEmitter {
  private _listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  on(event: string, fn: (...args: unknown[]) => void): this {
    (this._listeners[event] ??= []).push(fn);
    return this;
  }

  off(event: string, fn: (...args: unknown[]) => void): this {
    const arr = this._listeners[event];
    if (arr) {
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const arr = this._listeners[event];
    if (arr) {
      for (const fn of arr) fn(...args);
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
    return this;
  }

  listenerCount(event: string): number {
    return this._listeners[event]?.length ?? 0;
  }
}

const Phaser = {
  Events: { EventEmitter },
};

export default Phaser;
export { EventEmitter };

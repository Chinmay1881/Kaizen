type EventHandler = (payload: unknown) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) ?? new Set<EventHandler>();
    existing.add(handler);
    this.handlers.set(event, existing);
  }

  /**
   * Every call site does `void eventBus.emit(...)` (fire-and-forget — the HTTP response doesn't
   * wait on notification/gamification side effects). Each handler is caught individually so one
   * handler throwing (e.g. a transient DB error) can't reject this method's own promise — with no
   * caller ever attaching a `.catch()`, an uncaught rejection here would surface as a Node
   * `unhandledRejection` and risk taking the whole process down over what should be a
   * best-effort side effect.
   */
  async emit(event: string, payload: unknown) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    await Promise.all(
      [...handlers].map((handler) =>
        Promise.resolve()
          .then(() => handler(payload))
          .catch((error: unknown) => {
            console.error(`[kaizen-api] Event handler for "${event}" failed:`, error);
          }),
      ),
    );
  }
}

export const eventBus = new EventBus();

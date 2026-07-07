type EventHandler = (payload: unknown) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) ?? new Set<EventHandler>();
    existing.add(handler);
    this.handlers.set(event, existing);
  }

  async emit(event: string, payload: unknown) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    await Promise.all([...handlers].map((handler) => handler(payload)));
  }
}

export const eventBus = new EventBus();

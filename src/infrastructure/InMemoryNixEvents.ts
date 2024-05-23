import type { NixEvent, NixEventId, NixEventType, NixNewEvent } from 'src/domain/NixEvent'
import type { NixEvents } from 'src/domain/NixEvents'
import type { NixSubscriber, NixSubscriberId } from 'src/domain/NixSubscriber'
import { EventIdIsRequired } from 'src/domain/errors'

export class InMemoryNixEvents implements NixEvents {
  private subscribers: Record<NixEventType, NixSubscriber[]>
  private events: Record<NixSubscriberId, NixEvent[]>
  private retries: Record<NixSubscriberId, Record<NixEventId, number>>

  constructor() {
    this.subscribers = {}
    this.events = {}
    this.retries = {}
  }

  public async findNextEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]> {
    const concurrency = subscriber.config.concurrency
    const allEvents = this.ensureEventList(subscriber.id)

    return allEvents.splice(0, concurrency).filter((e) => {
      const retries = this.ensureRetryRecord(subscriber.id, e.id)
      return retries < subscriber.config.maxRetries
    })
  }

  public async getAllEventsTypesAndPayloads(): Promise<
    Array<{ type: string; payload: Record<string, any> }>
  > {
    const events = Object.values(this.events).flat()

    const uniqueEvents = new Map<string, NixEvent>()
    events.forEach((event) => {
      uniqueEvents.set(event.id, event)
    })

    return Array.from(uniqueEvents.values()).map((event) => {
      return {
        type: event.type,
        payload: event.payload,
      }
    })
  }

  public async getSubscribers(): Promise<NixSubscriber[]> {
    return Object.values(this.subscribers).flat()
  }

  public async getSubscribersByEventType(evenType: string): Promise<NixSubscriber[]> {
    this.subscribers[evenType] = this.subscribers[evenType] || []
    return Promise.resolve(this.subscribers[evenType])
  }

  public async subscribe(eventType: string, subscriber: NixSubscriber): Promise<void> {
    this.subscribers[eventType] = this.subscribers[eventType] || []
    this.subscribers[eventType].push(subscriber)
  }

  public async unsubscribe(eventType: string, subscriberId: string): Promise<void> {
    this.subscribers[eventType] = this.subscribers[eventType].filter((s) => s.id !== subscriberId)

    if (this.events[subscriberId]) {
      delete this.events[subscriberId]
    }
    if (this.retries[subscriberId]) {
      delete this.retries[subscriberId]
    }
  }

  public async unsubscribeAll(): Promise<void> {
    this.subscribers = {}
    this.events = {}
    this.retries = {}
  }

  public async markAsFailed({
    event,
    subscriber,
  }: {
    event: NixEvent
    subscriber: NixSubscriber
  }): Promise<void> {
    const retries = this.ensureRetryRecord(subscriber.id, event.id)
    this.retries[subscriber.id][event.id] = retries + 1

    this.ensureEventList(subscriber.id).push(event)
  }

  public async markAsFinished({
    event,
    subscriber,
  }: {
    event: NixEvent
    subscriber: NixSubscriber
  }): Promise<void> {
    if (this.retries[subscriber.id]?.[event.id] >= 0) {
      delete this.retries[subscriber.id][event.id]
    }
  }

  public async put({ event }: { event: NixNewEvent | NixEvent }): Promise<void> {
    if (!event.id) {
      throw new EventIdIsRequired()
    }

    const e: NixEvent = {
      id: event.id,
      type: event.type,
      payload: event.payload,
      created_at: event.created_at || new Date(),
      updated_at: event.updated_at || new Date(),
    }
    const subscribers = await this.getSubscribersByEventType(e.type)
    subscribers.forEach((subscriber) => {
      this.ensureEventList(subscriber.id).push(e)
      this.ensureRetryRecord(subscriber.id, e.id)
    })
  }

  private ensureEventList(subscriberId: string): NixEvent[] {
    return (this.events[subscriberId] = this.events[subscriberId] || [])
  }

  private ensureRetryRecord(subscriberId: string, eventId: string): number {
    if (!this.retries[subscriberId]) {
      this.retries[subscriberId] = {}
    }
    return (this.retries[subscriberId][eventId] = this.retries[subscriberId][eventId] || 0)
  }
}

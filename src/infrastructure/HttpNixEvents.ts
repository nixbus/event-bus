import type { NixEvent, NixNewEvent } from 'src/domain/NixEvent'
import type { NixEvents } from 'src/domain/NixEvents'
import type { NixSubscriber, NixSubscriberId } from 'src/domain/NixSubscriber'
import type {
  FindEventResponse,
  NixBusHttpClient,
  SubscriberResponse,
} from 'src/infrastructure/NixBusHttpClient'

export class HttpNixEvents implements NixEvents {
  private readonly subscribers: Record<NixSubscriberId, NixSubscriber>
  private readonly markedAsFinished: Array<{ id: string; subscriberId: string }>
  private readonly markedAsFailed: Array<{ id: string; subscriberId: string }>
  private readonly eventsToPublish: Array<{ type: string; payload: Record<string, any> }>
  private isPublishingEvents: boolean
  private isMarkingEventsAsFailed: boolean
  private isMarkingEventsAsFinished: boolean

  constructor(private deps: { client: NixBusHttpClient }) {
    this.subscribers = {}
    this.markedAsFinished = []
    this.markedAsFailed = []
    this.eventsToPublish = []
    this.isPublishingEvents = false
    this.isMarkingEventsAsFailed = false
    this.isMarkingEventsAsFinished = false
  }

  public async findNextEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]> {
    const { events } = await this.deps.client.findNextEvents({ subscriberId: subscriber.id })
    return events.map((e) => this.serializeEvent(e))
  }

  public async getSubscribers(): Promise<NixSubscriber[]> {
    return Object.values(this.subscribers)
  }

  public async getSubscribersByEventType(): Promise<NixSubscriber[]> {
    return []
  }

  public async subscribe(eventType: string, subscriber: NixSubscriber): Promise<void> {
    await this.deps.client.putSubscriber({
      subscriberId: subscriber.id,
      eventType,
      config: subscriber.config,
    })
    this.subscribers[subscriber.id] = subscriber
  }

  public async unsubscribe(eventType: string, subscriberId: string): Promise<void> {
    await this.deps.client.removeSubscriber({
      subscriberId,
      eventType,
    })
  }

  public async unsubscribeAll(): Promise<void> {
    await this.deps.client.removeAllSubscribers()
  }

  public async markAsFailed({
    event,
    subscriber,
  }: {
    event: NixEvent
    subscriber: NixSubscriber
  }): Promise<void> {
    this.markedAsFailed.push({ id: event.id, subscriberId: subscriber.id })

    if (this.isMarkingEventsAsFailed) {
      return
    }

    this.isMarkingEventsAsFailed = true

    while (this.markedAsFailed.length > 0) {
      const events = this.markedAsFailed.splice(0, this.markedAsFailed.length)
      if (events.length === 0) return

      await this.deps.client.markEventsAsFailed({
        events,
      })
    }

    this.isMarkingEventsAsFailed = false
  }

  public async markAsFinished({
    event,
    subscriber,
  }: {
    event: NixEvent
    subscriber: NixSubscriber
  }): Promise<void> {
    this.markedAsFinished.push({ id: event.id, subscriberId: subscriber.id })

    if (this.isMarkingEventsAsFinished) {
      return
    }

    this.isMarkingEventsAsFinished = true

    while (this.markedAsFinished.length > 0) {
      const events = this.markedAsFinished.splice(0, this.markedAsFinished.length)
      if (events.length === 0) return

      await this.deps.client.markEventsAsFinished({
        events,
      })
    }

    this.isMarkingEventsAsFinished = false
  }

  public async put({ event }: { event: NixNewEvent | NixEvent }): Promise<void> {
    this.eventsToPublish.push({
      type: event.type,
      payload: event.payload,
    })

    if (this.isPublishingEvents) {
      return
    }

    this.isPublishingEvents = true

    while (this.eventsToPublish.length > 0) {
      const events = this.eventsToPublish.splice(0, this.eventsToPublish.length)
      if (events.length === 0) return

      await this.deps.client.publishEvents({ events })
    }

    this.isPublishingEvents = false
  }

  private serializeEvent(i: FindEventResponse): NixEvent {
    return {
      id: i.id,
      type: i.type,
      payload: i.payload,
      created_at: new Date(i.created_at),
      updated_at: new Date(i.updated_at),
    }
  }

  private serializeSubscriber(i: SubscriberResponse): NixSubscriber {
    return {
      id: i.id,
      config: {
        maxRetries: i.config.max_retries,
        timeout: i.config.timeout,
        concurrency: i.config.concurrency,
      },
    }
  }
}

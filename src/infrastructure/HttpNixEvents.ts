import type { NixEvent, NixNewEvent } from 'src/domain/NixEvent'
import type { NixEvents } from 'src/domain/NixEvents'
import type { NixSubscriber } from 'src/domain/NixSubscriber'
import type {
  FindEventResponse,
  NixBusHttpClient,
  SubscriberResponse,
} from 'src/infrastructure/NixBusHttpClient'

export class HttpNixEvents implements NixEvents {
  constructor(private deps: { client: NixBusHttpClient }) {}

  public async findNextEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]> {
    const { events } = await this.deps.client.findNextEvents({ subscriberId: subscriber.id })
    return events.map((e) => this.serializeEvent(e))
  }

  public async getSubscribers(): Promise<NixSubscriber[]> {
    const { subscribers } = await this.deps.client.getSubscribers()
    return subscribers.map((s) => this.serializeSubscriber(s))
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
    await this.deps.client.markEventAsFailed({
      subscriberId: subscriber.id,
      eventId: event.id,
    })
  }

  public async markAsFinished({
    event,
    subscriber,
  }: {
    event: NixEvent
    subscriber: NixSubscriber
  }): Promise<void> {
    await this.deps.client.markEventAsFinished({
      subscriberId: subscriber.id,
      eventId: event.id,
    })
  }

  public async put({ event }: { event: NixNewEvent | NixEvent }): Promise<void> {
    await this.deps.client.publishEvent({
      eventType: event.type,
      payload: event.payload,
    })
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

import type { NixEvent, NixNewEvent } from 'src/domain/NixEvent'
import type { NixEvents } from 'src/domain/NixEvents'
import type { NixSubscriber, NixSubscriberAction, NixSubscriberId } from 'src/domain/NixSubscriber'
import { setAsyncInterval } from 'src/shared/interval'

type EventBusDeps = {
  events: NixEvents
}

export class NixEventBus {
  private readonly deps: EventBusDeps
  private subscribersActions: Record<string, NixSubscriberAction>

  constructor(deps: EventBusDeps) {
    this.deps = deps
    this.subscribersActions = {}
  }

  public async subscribe(
    eventType: string,
    subscriber: NixSubscriber & { action: NixSubscriberAction },
  ) {
    this.subscribersActions[subscriber.id] = subscriber.action
    await this.deps.events.subscribe(eventType, subscriber).catch(console.error)
  }

  public async unsubscribe(evenType: string, subscriberId: NixSubscriberId) {
    await this.deps.events.unsubscribe(evenType, subscriberId).catch(console.error)
  }

  public async unsubscribeAll() {
    this.subscribersActions = {}
    await this.deps.events.unsubscribeAll().catch(console.error)
  }

  public async publish(event: NixNewEvent) {
    await this.deps.events.put({ event }).catch(console.error)
  }

  public async run() {
    setAsyncInterval(async () => {
      await this.runScheduler()
    }, 1000)
  }

  private async runScheduler() {
    try {
      const subscribers = await this.deps.events.getSubscribers()
      await Promise.all(
        subscribers.map(async (s) => {
          return this.runSubscriber(s)
        }),
      )
    } catch (error: any) {
      console.error(`[EventBus] runScheduler error:`, error)
    }
  }

  private async runSubscriber(subscriber: NixSubscriber) {
    try {
      const events = await this.deps.events.findNextEventsFor(subscriber)

      Promise.all(
        events.map((event) => {
          console.log(`[EventBus] runSubscriber: ${subscriber.id} ${event.id}...`)
          return this.runSubscriberAction(event, subscriber)
        }),
      )
    } catch (error: any) {
      console.error(`[EventBus] runSubscriber error:`, error)
    }
  }

  private async runSubscriberAction(event: NixEvent, subscriber: NixSubscriber) {
    try {
      const action = this.subscribersActions[subscriber.id]
      await action(event)
      await this.deps.events.markAsFinished({
        event,
        subscriber,
      })
      console.log(
        `[EventBus] runSubscriberAction processed.`,
        JSON.stringify({ eventId: event.id, subscriberId: subscriber.id }),
      )
    } catch (error: any) {
      await this.deps.events.markAsFailed({
        event,
        subscriber,
      })
      console.error(
        `[EventBus] runSubscriberAction failed.`,
        JSON.stringify({ eventId: event.id, subscriberId: subscriber.id }),
        error,
      )
    }
  }
}

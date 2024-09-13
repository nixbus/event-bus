import type { NixEvent, NixNewEvent } from 'src/domain/NixEvent'
import type { NixEvents } from 'src/domain/NixEvents'
import type { NixSubscriber, NixSubscriberAction, NixSubscriberId } from 'src/domain/NixSubscriber'
import type { Logger } from 'src/infrastructure/Logger'
import { setAsyncInterval } from 'src/shared/interval'

type EventBusDeps = {
  events: NixEvents
  logger: Logger
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
    await this.deps.events
      .subscribe(eventType, subscriber)
      .catch((error) => this.deps.logger.error('EventBus', 'subscribe', { error }))
  }

  public async unsubscribe(evenType: string, subscriberId: NixSubscriberId) {
    await this.deps.events
      .unsubscribe(evenType, subscriberId)
      .catch((error) => this.deps.logger.error('EventBus', 'unsubscribe', { error }))
  }

  public async unsubscribeAll() {
    this.subscribersActions = {}
    await this.deps.events
      .unsubscribeAll()
      .catch((error) => this.deps.logger.error('EventBus', 'unsubscribeAll', { error }))
  }

  public async publish(event: NixNewEvent) {
    await this.deps.events
      .put({ event })
      .catch((error) => this.deps.logger.error('EventBus', 'publish', { error }))
  }

  public async run() {
    setAsyncInterval(async () => {
      await this.runScheduler()
    }, 1000)
  }

  private async runScheduler() {
    try {
      const subscribers = await this.deps.events.getSubscribers()
      this.deps.logger.debug('EventBus', 'runScheduler', {
        subscribers: subscribers.length,
        date: new Date().toISOString(),
      })
      await Promise.all(
        subscribers.map(async (s) => {
          return this.runSubscriber(s)
        }),
      )
    } catch (error: any) {
      this.deps.logger.error('EventBus', 'runScheduler', {
        error,
      })
    }
  }

  private async runSubscriber(subscriber: NixSubscriber) {
    try {
      const events = await this.deps.events.findNextEventsFor(subscriber)

      await Promise.all(
        events.map((event) => {
          this.deps.logger.info('EventBus', 'runSubscriber', {
            event_id: event.id,
            event_type: event.type,
            subscriber_id: subscriber.id,
          })
          return this.runSubscriberAction(event, subscriber)
        }),
      )
    } catch (error: any) {
      this.deps.logger.error('EventBus', 'runSubscriber', {
        method: 'runSubscriber',
        subscriber_id: subscriber.id,
        error,
      })
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
      this.deps.logger.info('EventBus', 'runSubscriberAction', {
        event_id: event.id,
        event_type: event.type,
        subscriber_id: subscriber.id,
        action: action.name,
      })
    } catch (error: any) {
      await this.deps.events.markAsFailed({
        event,
        subscriber,
      })
      this.deps.logger.error('EventBus', 'runSubscriberAction', {
        event_id: event.id,
        subscriber_id: subscriber.id,
        error,
      })
    }
  }
}

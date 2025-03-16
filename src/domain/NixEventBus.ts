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
  private subscribersDeadActions: Record<string, NixSubscriberAction>
  private hasSubscriberActionFailed: Record<string, boolean>
  private hasSubscriberDeadEvents: Record<string, boolean>

  constructor(deps: EventBusDeps) {
    this.deps = deps
    this.subscribersActions = {}
    this.subscribersDeadActions = {}
    this.hasSubscriberActionFailed = {}
    this.hasSubscriberDeadEvents = {}
  }

  public async subscribe(
    eventType: string,
    subscriber: NixSubscriber & { action: NixSubscriberAction; deadAction?: NixSubscriberAction },
  ) {
    this.subscribersActions[subscriber.id] = subscriber.action
    if (subscriber.deadAction) {
      this.subscribersDeadActions[subscriber.id] = subscriber.deadAction
      this.hasSubscriberDeadEvents[subscriber.id] = true
    }
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
      const deadEvents = await this.findDeadEventsFor(subscriber)

      await Promise.all([
        ...events.map((event) => {
          this.deps.logger.info('EventBus', 'runSubscriber', {
            event_id: event.id,
            event_type: event.type,
            subscriber_id: subscriber.id,
          })
          return this.runSubscriberAction(event, subscriber)
        }),
        ...deadEvents.map((event) => {
          this.deps.logger.info('EventBus', '[deadEvents] runSubscriber', {
            event_id: event.id,
            event_type: event.type,
            subscriber_id: subscriber.id,
          })
          return this.runDeadSubscriberAction(event, subscriber)
        }),
      ])
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
      this.enableFindDeadEventsFor(subscriber)
      this.deps.logger.error('EventBus', 'runSubscriberAction', {
        event_id: event.id,
        subscriber_id: subscriber.id,
        error: JSON.stringify(error.message),
      })
    }
  }

  private async runDeadSubscriberAction(event: NixEvent, subscriber: NixSubscriber) {
    try {
      const action = this.subscribersDeadActions[subscriber.id]
      if (!action) return
      await action(event)
      await this.deps.events.markAsFinished({
        event,
        subscriber,
      })
      this.deps.logger.info('EventBus', 'runDeadSubscriberAction', {
        event_id: event.id,
        event_type: event.type,
        subscriber_id: subscriber.id,
        action: action.name,
      })
    } catch (error: any) {
      await this.deps.events.markAsFinished({
        event,
        subscriber,
      })
      this.deps.logger.error('EventBus', 'runDeadSubscriberAction', {
        event_id: event.id,
        subscriber_id: subscriber.id,
        error,
      })
    }
  }

  private enableFindDeadEventsFor(subscriber: NixSubscriber) {
    setTimeout(() => {
      this.hasSubscriberActionFailed[subscriber.id] = true
    }, subscriber.config.timeout * 1000)
  }

  private async findDeadEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]> {
    let deadEvents: NixEvent[] = []
    if (
      (this.hasSubscriberActionFailed[subscriber.id] ||
        this.hasSubscriberDeadEvents[subscriber.id]) &&
      this.subscribersDeadActions[subscriber.id]
    ) {
      this.hasSubscriberDeadEvents[subscriber.id] = true
      deadEvents = await this.deps.events.findDeadEventsFor(subscriber)
      if (deadEvents.length === 0) {
        this.hasSubscriberDeadEvents[subscriber.id] = false
      }
      this.hasSubscriberActionFailed[subscriber.id] = false
    }
    return deadEvents
  }
}

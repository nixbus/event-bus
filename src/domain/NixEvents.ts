import type { NixEvent, NixNewEvent } from 'src/domain/NixEvent'
import type { NixSubscriber } from 'src/domain/NixSubscriber'

export interface NixEvents {
  findNextEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]>

  findDeadEventsFor(subscriber: NixSubscriber): Promise<NixEvent[]>

  getSubscribers(): Promise<NixSubscriber[]>

  getSubscribersByEventType(evenType: string): Promise<NixSubscriber[]>

  markAsFailed(params: { event: NixEvent; subscriber: NixSubscriber }): Promise<void>

  markAsFinished(params: { event: NixEvent; subscriber: NixSubscriber }): Promise<void>

  put(params: { event: NixNewEvent | NixEvent }): Promise<void>

  subscribe(eventType: string, subscriber: NixSubscriber): Promise<void>

  unsubscribe(eventType: string, subscriberId: string): Promise<void>

  unsubscribeAll(): Promise<void>
}

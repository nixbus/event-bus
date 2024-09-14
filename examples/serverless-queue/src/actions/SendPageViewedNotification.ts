import type { NixSubscriberAction } from '@nixbus/event-bus'

import { PageViewed } from 'src/events/PageViewed'

export const SendPageViewedNotification: NixSubscriberAction = async (event) => {
  const pageViewedEvent = PageViewed.fromDomainEvent(event)
  console.log(
    `[SendPageViewedNotification] Consuming ${PageViewed.getEventType()}: ${pageViewedEvent.getPayload().title}`,
  )
}

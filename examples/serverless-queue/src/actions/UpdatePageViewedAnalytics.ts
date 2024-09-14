import type { NixSubscriberAction } from '@nixbus/event-bus'

import { PageViewed } from 'src/events/PageViewed'

export const UpdatePageViewedAnalytics: NixSubscriberAction = async (event) => {
  const pageViewedEvent = PageViewed.fromDomainEvent(event)
  console.log(
    `[UpdatePageViewedAnalytics] Consuming ${PageViewed.getEventType()}: ${pageViewedEvent.getPayload().title}`,
  )
}

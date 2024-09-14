import type { NixEvent, NixNewEvent } from '@nixbus/event-bus'

type Payload = {
  title: string
}

export class PageViewed {
  constructor(private attrs: NixEvent) {}

  public getPayload(): Payload {
    return this.attrs.payload as Payload
  }

  public static create(payload: Payload): NixNewEvent {
    return {
      type: PageViewed.getEventType(),
      payload,
    }
  }

  public static fromDomainEvent(domainEvent: NixEvent): PageViewed {
    return new PageViewed(domainEvent)
  }

  static getEventType(): string {
    return 'PageViewed'
  }
}

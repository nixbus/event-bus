import type { NixBusCrypto } from '@nixbus/crypto'

import type { NixSubscriberId } from 'src/domain/NixSubscriber'
import type { Logger } from 'src/infrastructure/Logger'
import { authorizationBearer, fetchJson } from 'src/shared/fetch'

export type EventsResponse = {
  events: EventResponse[]
}

export type EventResponse = {
  id: string
  type: string
  payload: string
  created_at: Date
  updated_at: Date
}

export type FindEventsResponse = {
  events: FindEventResponse[]
}

export type FindEventResponse = {
  id: string
  type: string
  payload: Record<string, any>
  created_at: Date
  updated_at: Date
}

export type SubscribersResponse = {
  subscribers: SubscriberResponse[]
}

export type SubscriberResponse = {
  id: string
  event_type: string
  config: {
    max_retries: number
    timeout: number
    concurrency: number
  }
}

export type FindNextEventsRequest = {
  subscriber_id: string
}

export type MarkEventsAsFailedRequest = {
  events: { id: string; subscriber_id: string }[]
}

export type MarkEventsAsFinishedRequest = {
  events: { id: string; subscriber_id: string }[]
}

export type PublishEventsRequest = {
  events: { type: string; payload: string }[]
}

export type PutSubscriberRequest = {
  subscriber_id: string
  event_type: string
  config: {
    max_retries: number
    timeout: number
    concurrency: number
  }
}

export type RemoveSubscriberRequest = {
  event_type: string
  subscriber_id: string
}

type Deps = {
  crypto: NixBusCrypto | null
  logger: Logger
}
export type NixBusHttpClientOptions = {
  token: string
  baseUrl?: string
}
export class NixBusHttpClient {
  private readonly baseUrl: string
  private findNextEventsTimeout: Record<NixSubscriberId, number>

  constructor(
    private deps: Deps,
    private opts: NixBusHttpClientOptions,
  ) {
    if (!this.opts.token) {
      throw new Error(
        '[NixBusHttpClient] token is required. Get your free token at https://nixbus.com',
      )
    }

    this.baseUrl = opts.baseUrl || 'https://nixbus.com/api/v1'
    this.findNextEventsTimeout = {}
  }

  public async findNextEvents({
    subscriberId,
  }: {
    subscriberId: string
  }): Promise<FindEventsResponse> {
    if (this.findNextEventsTimeout[subscriberId]) {
      await wait(this.findNextEventsTimeout[subscriberId])
    }

    const body: FindNextEventsRequest = {
      subscriber_id: subscriberId,
    }
    const response = await fetchJson(`${this.baseUrl}/find_next_events`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
    const json = await response.json()
    const data = json as EventsResponse

    if (data.events.length === 0) {
      this.findNextEventsTimeout[subscriberId] = this.findNextEventsTimeout[subscriberId] || 0

      if (this.findNextEventsTimeout[subscriberId] < 30000) {
        this.findNextEventsTimeout[subscriberId] += 1000
      }
    } else {
      this.findNextEventsTimeout = {}
    }

    const e = await Promise.all(data.events.map((i) => this.deserialize(subscriberId, i)))
    const events = e.filter((i) => i !== null) as FindEventResponse[]
    return {
      events,
    }
  }

  public async getSubscribers(): Promise<SubscribersResponse> {
    const response = await fetchJson(`${this.baseUrl}/get_subscribers`, {
      method: 'POST',
      headers: authorizationBearer(this.opts.token),
    })
    const data = await response.json()
    return data as SubscribersResponse
  }

  public async markEventsAsFailed({
    events,
  }: {
    events: { id: string; subscriberId: string }[]
  }): Promise<void> {
    const body: MarkEventsAsFailedRequest = {
      events: events.map((e) => ({ id: e.id, subscriber_id: e.subscriberId })),
    }
    await fetchJson(`${this.baseUrl}/mark_events_as_failed`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
  }

  public async markEventsAsFinished({
    events,
  }: {
    events: { id: string; subscriberId: string }[]
  }): Promise<void> {
    const body: MarkEventsAsFinishedRequest = {
      events: events.map((e) => ({ id: e.id, subscriber_id: e.subscriberId })),
    }
    await fetchJson(`${this.baseUrl}/mark_events_as_finished`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
  }

  public async publishEvents({
    events,
  }: {
    events: Array<{ type: string; payload: Record<string, any> }>
  }): Promise<void> {
    const serializedEvents = await Promise.all(
      events.map(async (e) => {
        const payload = this.deps.crypto
          ? await this.deps.crypto.encrypt(JSON.stringify(e.payload))
          : JSON.stringify(e.payload)
        return {
          type: e.type,
          payload,
        }
      }),
    )

    const body: PublishEventsRequest = {
      events: serializedEvents,
    }
    await fetchJson(`${this.baseUrl}/publish_events`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
  }

  public async putSubscriber({
    subscriberId,
    eventType,
    config,
  }: {
    subscriberId: string
    eventType: string
    config: { maxRetries: number; concurrency: number; timeout: number }
  }): Promise<void> {
    const body: PutSubscriberRequest = {
      subscriber_id: subscriberId,
      event_type: eventType,
      config: {
        max_retries: config.maxRetries,
        timeout: config.timeout,
        concurrency: config.concurrency,
      },
    }
    await fetchJson(`${this.baseUrl}/put_subscriber`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
  }

  public async removeAllSubscribers(): Promise<void> {
    await fetchJson(`${this.baseUrl}/remove_all_subscribers`, {
      method: 'POST',
      headers: authorizationBearer(this.opts.token),
    })
  }

  public async removeSubscriber({
    eventType,
    subscriberId,
  }: {
    eventType: string
    subscriberId: string
  }): Promise<void> {
    const body: RemoveSubscriberRequest = {
      event_type: eventType,
      subscriber_id: subscriberId,
    }
    await fetchJson(`${this.baseUrl}/remove_subscriber`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: authorizationBearer(this.opts.token),
    })
  }

  private async deserialize(
    subscriberId: string,
    i: EventResponse,
  ): Promise<FindEventResponse | null> {
    try {
      const payload = this.deps.crypto ? await this.deps.crypto.decrypt(i.payload) : i.payload
      return {
        id: i.id,
        type: i.type,
        payload: JSON.parse(payload),
        created_at: new Date(i.created_at),
        updated_at: new Date(i.updated_at),
      }
    } catch (error) {
      this.deps.logger.error('NixBusHttpClient', 'deserialize', { event_id: i.id, error })
      await this.markEventsAsFailed({
        events: [
          {
            id: i.id,
            subscriberId,
          },
        ],
      })
      return null
    }
  }
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

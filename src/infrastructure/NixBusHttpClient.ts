import type { NixBusCrypto } from '@nixbus/crypto'

import type { NixSubscriberId } from 'src/domain/NixSubscriber'
import { fetchJson } from 'src/shared/fetch'

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
  token: string
  subscriber_id: string
}

export type GetSubscribersRequest = {
  token: string
}

export type MarkEventAsFailedRequest = {
  token: string
  subscriber_id: string
  event_id: string
}

export type MarkEventAsFinishedRequest = {
  token: string
  subscriber_id: string
  event_id: string
}

export type PublishEventRequest = {
  token: string
  event_type: string
  payload: string
}

export type PutSubscriberRequest = {
  token: string
  subscriber_id: string
  event_type: string
  config: {
    max_retries: number
    timeout: number
    concurrency: number
  }
}

export type RemoveAllSubscribersRequest = {
  token: string
}

export type RemoveSubscriberRequest = {
  token: string
  event_type: string
  subscriber_id: string
}

type Deps = {
  crypto: NixBusCrypto | null
}
export type NixBusHttpClientOptions = {
  token: string
  baseUrl?: string
}
export class NixBusHttpClient {
  private readonly baseUrl: string
  private readonly findNextEventsTimeout: Record<NixSubscriberId, number>

  constructor(
    private deps: Deps,
    private opts: NixBusHttpClientOptions,
  ) {
    if (!this.opts.token) {
      throw new Error('[NixBusHttpClient] token is required')
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
      token: this.opts.token,
      subscriber_id: subscriberId,
    }
    const response = await fetchJson(`${this.baseUrl}/find_next_events`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const json = await response.json()
    const data = json as EventsResponse

    if (data.events.length === 0) {
      this.findNextEventsTimeout[subscriberId] = this.findNextEventsTimeout[subscriberId] || 0

      if (this.findNextEventsTimeout[subscriberId] < 30000) {
        this.findNextEventsTimeout[subscriberId] += 1000
      }
    } else {
      delete this.findNextEventsTimeout[subscriberId]
    }

    const e = await Promise.all(data.events.map((i) => this.serialize(subscriberId, i)))
    const events = e.filter((i) => i !== null) as FindEventResponse[]
    return {
      events,
    }
  }

  public async getSubscribers(): Promise<SubscribersResponse> {
    const body: GetSubscribersRequest = {
      token: this.opts.token,
    }
    const response = await fetchJson(`${this.baseUrl}/get_subscribers`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return data as SubscribersResponse
  }

  public async markEventAsFailed({
    subscriberId,
    eventId,
  }: {
    subscriberId: string
    eventId: string
  }): Promise<void> {
    const body: MarkEventAsFailedRequest = {
      token: this.opts.token,
      subscriber_id: subscriberId,
      event_id: eventId,
    }
    await fetchJson(`${this.baseUrl}/mark_event_as_failed`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  public async markEventAsFinished({
    subscriberId,
    eventId,
  }: {
    subscriberId: string
    eventId: string
  }): Promise<void> {
    const body: MarkEventAsFinishedRequest = {
      token: this.opts.token,
      subscriber_id: subscriberId,
      event_id: eventId,
    }
    await fetchJson(`${this.baseUrl}/mark_event_as_finished`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  public async publishEvent({
    eventType,
    payload,
  }: {
    eventType: string
    payload: Record<string, any>
  }): Promise<void> {
    const stringPayload = JSON.stringify(payload)
    const d = this.deps.crypto
      ? await this.deps.crypto.encrypt(JSON.stringify(payload))
      : stringPayload
    const body: PublishEventRequest = {
      token: this.opts.token,
      event_type: eventType,
      payload: d,
    }
    await fetchJson(`${this.baseUrl}/publish_event`, {
      method: 'POST',
      body: JSON.stringify(body),
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
      token: this.opts.token,
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
    })
  }

  public async removeAllSubscribers(): Promise<void> {
    const body: RemoveAllSubscribersRequest = {
      token: this.opts.token,
    }

    await fetchJson(`${this.baseUrl}/remove_all_subscribers`, {
      method: 'POST',
      body: JSON.stringify(body),
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
      token: this.opts.token,
      event_type: eventType,
      subscriber_id: subscriberId,
    }
    await fetchJson(`${this.baseUrl}/remove_subscriber`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  private async serialize(
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
      console.log(
        `[NixBusHttpClient] Decryption failed for event ${i.id}. Marking as failed.`,
        i.payload,
        error,
      )
      await this.markEventAsFailed({ subscriberId, eventId: i.id })
      return null
    }
  }
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

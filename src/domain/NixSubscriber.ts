import type { NixEvent } from 'src/domain/NixEvent'

export type NixSubscriberId = string

export type NixSubscriberConfig = {
  maxRetries: number
  timeout: number
  concurrency: number
}

export type NixSubscriber = {
  id: NixSubscriberId
  config: NixSubscriberConfig
}

export type NixSubscriberAction = (payload: NixEvent) => Promise<any>

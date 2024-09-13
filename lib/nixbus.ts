import type { NixBusCrypto } from '@nixbus/crypto'
import { createNixBusCrypto } from '@nixbus/crypto'

import type { LogLevel } from 'src/infrastructure/Logger'
import { NixEventBus } from 'src/domain/NixEventBus'
import { Logger } from 'src/infrastructure/Logger'
import { NixBusHttpClient } from 'src/infrastructure/NixBusHttpClient'
import { NixEventsHttp } from 'src/infrastructure/NixEventsHttp'
import { NixEventsInMemory } from 'src/infrastructure/NixEventsInMemory'

export type { NixEvents } from 'src/domain/NixEvents'
export type { NixSubscriber } from 'src/domain/NixSubscriber'
export type { NixSubscriberAction } from 'src/domain/NixSubscriber'
export type { NixSubscriberId } from 'src/domain/NixSubscriber'
export type { NixSubscriberConfig } from 'src/domain/NixSubscriber'
export type { NixEvent } from 'src/domain/NixEvent'
export type { NixNewEvent } from 'src/domain/NixEvent'

export { NixEventBus } from 'src/domain/NixEventBus'
export { NixEventsHttp } from 'src/infrastructure/NixEventsHttp'
export { NixEventsInMemory } from 'src/infrastructure/NixEventsInMemory'
export { NixBusHttpClient } from 'src/infrastructure/NixBusHttpClient'
export { EventIdIsRequired } from 'src/domain/errors'
export { Logger } from 'src/infrastructure/Logger'

type NixBusInMemoryOptions = {
  log?: LogLevel
}

let _nixBusInMemory: NixEventBus | null = null
export function getNixBusInMemory(options: NixBusInMemoryOptions = {}): NixEventBus {
  if (_nixBusInMemory) {
    return _nixBusInMemory
  }
  _nixBusInMemory = createNixBusInMemory(options)
  return _nixBusInMemory
}

export function createNixBusInMemory(options: NixBusInMemoryOptions = {}): NixEventBus {
  const events = new NixEventsInMemory()
  const logger = new Logger({ level: options.log?.level })
  return new NixEventBus({ events, logger })
}

type NixBusHttpOptions = {
  passphrase: string
  token: string
  clientEncryption?: boolean
  baseUrl?: string
  log?: LogLevel
}

let _nixBusHttp: NixEventBus | null = null
export function getNixBusHttp(options: NixBusHttpOptions): NixEventBus {
  if (_nixBusHttp) {
    return _nixBusHttp
  }
  _nixBusHttp = createNixBusHttp(options)
  return _nixBusHttp
}

export function createNixBusHttp(options: NixBusHttpOptions): NixEventBus {
  const logger = new Logger({ level: options.log?.level })
  const encrypted = options.clientEncryption ?? true

  let nixBusCrypto: NixBusCrypto | null = null
  if (encrypted) {
    const defaultPassphraseVersion = 'v1'
    nixBusCrypto = createNixBusCrypto({
      defaultPassphraseVersion,
      passphrases: [{ version: defaultPassphraseVersion, phrase: options.passphrase }],
    })
  }

  const client = new NixBusHttpClient(
    { crypto: nixBusCrypto, logger },
    { token: options.token, baseUrl: options.baseUrl },
  )
  const events = new NixEventsHttp({ client })
  return new NixEventBus({ events, logger })
}

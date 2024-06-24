import { getNixBusCrypto } from '@nixbus/crypto'

import type { LogLevel } from 'src/infrastructure/Logger'
import { NixEventBus } from 'src/domain/NixEventBus'
import { HttpNixEvents } from 'src/infrastructure/HttpNixEvents'
import { InMemoryNixEvents } from 'src/infrastructure/InMemoryNixEvents'
import { Logger } from 'src/infrastructure/Logger'
import { NixBusHttpClient } from 'src/infrastructure/NixBusHttpClient'

export type { NixEvents } from 'src/domain/NixEvents'
export type { NixSubscriber } from 'src/domain/NixSubscriber'
export type { NixSubscriberAction } from 'src/domain/NixSubscriber'
export type { NixSubscriberId } from 'src/domain/NixSubscriber'
export type { NixSubscriberConfig } from 'src/domain/NixSubscriber'
export type { NixEvent } from 'src/domain/NixEvent'
export type { NixNewEvent } from 'src/domain/NixEvent'

export { NixEventBus } from 'src/domain/NixEventBus'
export { HttpNixEvents } from 'src/infrastructure/HttpNixEvents'
export { InMemoryNixEvents } from 'src/infrastructure/InMemoryNixEvents'
export { NixBusHttpClient } from 'src/infrastructure/NixBusHttpClient'
export { EventIdIsRequired } from 'src/domain/errors'

type InMemoryNixBusOptions = {
  log?: LogLevel
}

let _inMemoryNixBus: NixEventBus | null = null
export function getInMemoryNixBus(options: InMemoryNixBusOptions = {}): NixEventBus {
  if (_inMemoryNixBus) {
    return _inMemoryNixBus
  }
  _inMemoryNixBus = createInMemoryNixBus(options)
  return _inMemoryNixBus
}

export function createInMemoryNixBus(options: InMemoryNixBusOptions = {}): NixEventBus {
  const events = new InMemoryNixEvents()
  const logger = new Logger({ level: options.log?.level })
  return new NixEventBus({ events, logger })
}

type HttpNixBusOptions = {
  passphrase: string
  token: string
  clientEncryption?: boolean
  baseUrl?: string
  log?: LogLevel
}

let _httpNixBus: NixEventBus | null = null
export function getHttpNixBus(options: HttpNixBusOptions): NixEventBus {
  if (_httpNixBus) {
    return _httpNixBus
  }
  _httpNixBus = createHttpNixBus(options)
  return _httpNixBus
}

export function createHttpNixBus(options: HttpNixBusOptions): NixEventBus {
  const logger = new Logger({ level: options.log?.level })
  const encrypted = options.clientEncryption ?? true
  if (!encrypted) {
    const client = new NixBusHttpClient(
      { crypto: null, logger },
      { token: options.token, baseUrl: options.baseUrl },
    )
    const events = new HttpNixEvents({ client })
    return new NixEventBus({ events, logger })
  }

  const defaultPassphraseVersion = 'v1'
  const nixBusCrypto = getNixBusCrypto({
    defaultPassphraseVersion,
    passphrases: [{ version: defaultPassphraseVersion, phrase: options.passphrase }],
  })
  const client = new NixBusHttpClient(
    { crypto: nixBusCrypto, logger },
    { token: options.token, baseUrl: options.baseUrl },
  )
  const events = new HttpNixEvents({ client })
  return new NixEventBus({ events, logger })
}

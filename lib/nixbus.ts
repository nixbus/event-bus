import { getNixBusCrypto } from '@nixbus/crypto'

import { NixEventBus } from 'src/domain/NixEventBus'
import { HttpNixEvents } from 'src/infrastructure/HttpNixEvents'
import { InMemoryNixEvents } from 'src/infrastructure/InMemoryNixEvents'
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

let _inMemoryNixBus: NixEventBus | null = null
export function getInMemoryNixBus(): NixEventBus {
  if (_inMemoryNixBus) {
    return _inMemoryNixBus
  }

  const events = new InMemoryNixEvents()
  _inMemoryNixBus = new NixEventBus({ events })

  return _inMemoryNixBus
}

let _httpNixBus: NixEventBus | null = null
export function getHttpNixBus(options: {
  passphrase: string
  token: string
  clientEncryption?: boolean
  baseUrl?: string
}): NixEventBus {
  if (_httpNixBus) {
    return _httpNixBus
  }

  const encrypted = options.clientEncryption ?? true
  if (!encrypted) {
    const client = new NixBusHttpClient(
      { crypto: null },
      { token: options.token, baseUrl: options.baseUrl },
    )
    const events = new HttpNixEvents({ client })
    _httpNixBus = new NixEventBus({ events })
    return _httpNixBus
  }

  const defaultPassphraseVersion = 'v1'
  const nixBusCrypto = getNixBusCrypto({
    defaultPassphraseVersion,
    passphrases: [{ version: defaultPassphraseVersion, phrase: options.passphrase }],
  })
  const client = new NixBusHttpClient(
    { crypto: nixBusCrypto },
    { token: options.token, baseUrl: options.baseUrl },
  )
  const events = new HttpNixEvents({ client })
  _httpNixBus = new NixEventBus({ events })

  return _httpNixBus
}

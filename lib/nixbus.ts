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

let inMemoryNixBus: NixEventBus | null = null
export async function getInMemoryNixBus(): Promise<NixEventBus> {
  if (inMemoryNixBus) {
    return inMemoryNixBus
  }

  const events = new InMemoryNixEvents()
  inMemoryNixBus = new NixEventBus({ events })

  return inMemoryNixBus
}

let httpNixBus: NixEventBus | null = null
export async function getHttpNixBus(options: {
  passphrase: string
  token: string
  clientEncryption?: boolean
}): Promise<NixEventBus> {
  if (httpNixBus) {
    return httpNixBus
  }

  const encrypted = options.clientEncryption ?? true
  if (!encrypted) {
    const client = new NixBusHttpClient({ crypto: null }, { token: options.token })
    const events = new HttpNixEvents({ client })
    httpNixBus = new NixEventBus({ events })
    return httpNixBus
  }

  const defaultPassphraseVersion = 'v1'
  const nixBusCrypto = await getNixBusCrypto({
    defaultPassphraseVersion,
    passphrases: [{ version: defaultPassphraseVersion, phrase: options.passphrase }],
  })
  const client = new NixBusHttpClient({ crypto: nixBusCrypto }, { token: options.token })
  const events = new HttpNixEvents({ client })
  httpNixBus = new NixEventBus({ events })

  return httpNixBus
}

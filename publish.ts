import { getNixBusHttp } from 'lib/nixbus'

async function main() {
  const nixbus = getNixBusHttp({
    token: 'bgkp4g1gwcs16zelbjhw0q3t',
    passphrase: 'your_passphrase',
    // baseUrl: 'http://localhost:3000/api/v1',
    clientEncryption: true,
    log: {
      level: 'debug',
    },
  })

  let id = 3
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await Promise.all([
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
      nixbus.publish({
        type: 'event_type',
        payload: { welcome: `to the event bus ${id++}` },
      }),
    ])
  }
}

main().catch(console.error)

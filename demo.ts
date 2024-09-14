import { getNixBusHttp } from 'lib/nixbus'

let i = 0
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

  await nixbus.subscribe('event_type', {
    id: 'any_other_subscriber_id',
    action: async function hey(event) {
      console.log(`subscriber_id:`, event, i++)
    },
    config: { maxRetries: 3, timeout: 10, concurrency: 500 },
  })

  nixbus.run()

  let id = 0
  await nixbus.publish({
    id: id.toString(),
    type: 'event_type',
    payload: { welcome: `to the event bus ${id++}` },
  })
}

main().catch(console.error)

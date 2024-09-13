const { getNixBusHttp } = require('@nixbus/event-bus')

async function main() {
  const bus = getNixBusHttp({
    token: process.env.NIXBUS_TOKEN,
    passphrase: process.env.NIXBUS_PASSPHRASE,
  })

  await bus.subscribe('an-example-event', {
    id: 'an-example-subscriber',
    action: async (event) => {
      console.log('Received event:', event)
    },
    config: { maxRetries: 3, timeout: 10, concurrency: 500 },
  })

  bus.run()
}

main().catch(console.error)

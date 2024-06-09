import { getHttpNixBus } from '@nixbus/event-bus'

async function main() {
  const bus = getHttpNixBus({
    token: process.env.NIXBUS_TOKEN,
    passphrase: process.env.NIXBUS_PASSPHRASE,
  })

  await bus.publish({
    type: 'an-example-event',
    payload: {
      welcome: 'to the event bus',
    },
  })

  // Simulate a long running process
  await new Promise((resolve) => setTimeout(resolve, 2000))

  await bus.publish({
    type: 'an-example-event',
    payload: {
      welcome: 'back to the event bus',
    },
  })
}

main().catch(console.error)

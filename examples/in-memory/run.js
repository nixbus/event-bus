import { getNixBusInMemory } from '@nixbus/event-bus'

async function main() {
  const bus = getNixBusInMemory()

  await bus.subscribe('an-example-event', {
    id: 'an-example-subscriber',
    action: async (event) => {
      console.log('Received event:', event)
    },
    config: { maxRetries: 3, timeout: 10, concurrency: 500 },
  })

  // Simulate a delayed events
  let id = 1
  setInterval(async () => {
    await bus.publish({
      id: `an-event-id-${id++}`,
      type: 'an-example-event',
      payload: {
        welcome: 'to the event bus',
      },
    })
  }, 2000)

  bus.run()
}

main().catch(console.error)

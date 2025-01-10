import { expect, test } from 'playwright/test'

import type { NixEvents } from 'src/domain/NixEvents'
import { NixEventBus } from 'src/domain/NixEventBus'
import { Logger } from 'src/infrastructure/Logger'
import { NixEventsInMemory } from 'src/infrastructure/NixEventsInMemory'

test.describe('NixEventBus', () => {
  let events: NixEvents
  let eventBus: NixEventBus

  test.beforeEach(() => {
    events = new NixEventsInMemory()
    eventBus = new NixEventBus({ events, logger: new Logger() })
  })

  test('subscribe to events', async () => {
    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    expect(events).verify()
  })

  test('unsubscribe to events', async () => {
    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.unsubscribe('an_event_type', 'a_subscriber_id')

    expect(events).verify()
  })

  test('unsubscribe all events', async () => {
    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.unsubscribeAll()

    expect(events).verify()
  })

  test('publish events', async () => {
    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      action: async () => null,
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.publish({
      id: 'an_event_id',
      type: 'an_event_type',
      payload: { hello: 'world' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })
    await eventBus.publish({
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { hello: 'world 2' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })

    expect(events).verify()
  })

  test('consume all events', async () => {
    const actions: Record<string, any[]> = {}

    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async (event) => {
        actions['a_subscriber_id'] = actions['a_subscriber_id'] || []
        actions['a_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      action: async (event) => {
        actions['another_subscriber_id'] = actions['another_subscriber_id'] || []
        actions['another_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      action: async (event) => {
        actions['any_other_subscriber_id'] = actions['any_other_subscriber_id'] || []
        actions['any_other_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.publish({
      id: 'an_event_id',
      type: 'an_event_type',
      payload: { hello: 'world' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })
    await eventBus.publish({
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { hello: 'world 2' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })

    await eventBus.run()
    await wait(2000)

    expect({ events, actions }).verify()
  })

  test('consume all events and dead events', async () => {
    const actions: Record<string, any[]> = {}
    const deadActions: Record<string, any[]> = {}

    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async (event) => {
        actions['a_subscriber_id'] = actions['a_subscriber_id'] || []
        actions['a_subscriber_id'].push(event)
        throw new Error('Any Subscriber Error')
      },
      config: { maxRetries: 3, timeout: 1, concurrency: 5 },
    })
    await eventBus.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      action: async (event) => {
        actions['another_subscriber_id'] = actions['another_subscriber_id'] || []
        actions['another_subscriber_id'].push(event)
        throw new Error('Any Subscriber Error')
      },
      deadAction: async (event) => {
        deadActions['another_subscriber_id'] = deadActions['another_subscriber_id'] || []
        deadActions['another_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 1, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      action: async (event) => {
        actions['any_other_subscriber_id'] = actions['any_other_subscriber_id'] || []
        actions['any_other_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 1, concurrency: 5 },
    })

    await eventBus.publish({
      id: 'an_event_id',
      type: 'an_event_type',
      payload: { hello: 'world' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })
    await eventBus.publish({
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { hello: 'world 2' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })

    await eventBus.run()
    await wait(4000)

    expect({ events, actions, deadActions }).verify()
  })

  test('consume all events and unsubscribe subscriber', async () => {
    const actions: Record<string, any[]> = {}

    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async (event) => {
        actions['a_subscriber_id'] = actions['a_subscriber_id'] || []
        actions['a_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      action: async (event) => {
        actions['another_subscriber_id'] = actions['another_subscriber_id'] || []
        actions['another_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      action: async (event) => {
        actions['any_other_subscriber_id'] = actions['any_other_subscriber_id'] || []
        actions['any_other_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.publish({
      id: 'an_event_id',
      type: 'an_event_type',
      payload: { hello: 'world' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })
    await eventBus.publish({
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { hello: 'world 2' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })

    await eventBus.run()
    await wait(2000)

    await eventBus.unsubscribe('an_event_type', 'a_subscriber_id')

    expect({ events, actions }).verify()
  })

  test('consume all events and unsubscribe all', async () => {
    const actions: Record<string, any[]> = {}

    await eventBus.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      action: async (event) => {
        actions['a_subscriber_id'] = actions['a_subscriber_id'] || []
        actions['a_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      action: async (event) => {
        actions['another_subscriber_id'] = actions['another_subscriber_id'] || []
        actions['another_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })
    await eventBus.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      action: async (event) => {
        actions['any_other_subscriber_id'] = actions['any_other_subscriber_id'] || []
        actions['any_other_subscriber_id'].push(event)
      },
      config: { maxRetries: 3, timeout: 10, concurrency: 5 },
    })

    await eventBus.publish({
      id: 'an_event_id',
      type: 'an_event_type',
      payload: { hello: 'world' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })
    await eventBus.publish({
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { hello: 'world 2' },
      created_at: new Date('2024-05-05T14:24:05.184Z'),
      updated_at: new Date('2024-05-05T14:24:05.184Z'),
    })

    await eventBus.run()
    await wait(2000)

    await eventBus.unsubscribeAll()

    expect({ events, actions }).verify()
  })
})

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

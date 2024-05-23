import { expect, test } from 'playwright/test'

import { InMemoryNixEvents } from 'src/infrastructure/InMemoryNixEvents'

test.describe('InMemoryNixEvents', () => {
  let inMemoryNixEvents: InMemoryNixEvents

  test.beforeEach(() => {
    inMemoryNixEvents = new InMemoryNixEvents()
  })

  test('put if no subscribers', async () => {
    await inMemoryNixEvents.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await inMemoryNixEvents.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('getAllEventsTypesAndPayloads', async () => {
    await inMemoryNixEvents.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await inMemoryNixEvents.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })

    await inMemoryNixEvents.put({
      event: {
        id: 'an_event_id',
        type: 'an_event_type',
        payload: { key: 'value' },
      },
    })
    await inMemoryNixEvents.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await inMemoryNixEvents.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('getAllEventsTypesAndPayloads with no duplicates', async () => {
    await inMemoryNixEvents.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await inMemoryNixEvents.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await inMemoryNixEvents.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })

    await inMemoryNixEvents.put({
      event: {
        id: 'an_event_id',
        type: 'an_event_type',
        payload: { key: 'value' },
      },
    })
    await inMemoryNixEvents.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await inMemoryNixEvents.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })
})

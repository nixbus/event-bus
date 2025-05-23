import { expect, test } from 'playwright/test'

import { NixEventsInMemory } from 'src/infrastructure/NixEventsInMemory'

test.describe('NixEventsInMemory', () => {
  let nixEventsInMemory: NixEventsInMemory

  test.beforeEach(() => {
    nixEventsInMemory = new NixEventsInMemory()
  })

  test('do not put the event if no subscribers', async () => {
    await nixEventsInMemory.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('mark the event as finished', async () => {
    const retryTimeoutInSeconds = 2
    const event = {
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { key: 'value_2' },
      created_at: new Date(),
      updated_at: new Date(),
    }
    const subscriber = {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: retryTimeoutInSeconds, concurrency: 1 },
    }

    await nixEventsInMemory.subscribe('another_event_type', subscriber)
    await nixEventsInMemory.put({ event })
    await nixEventsInMemory.findNextEventsFor(subscriber)

    await nixEventsInMemory.markAsFinished({
      event,
      subscriber,
    })

    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('mark the event as failed keep the event to retry', async () => {
    const retryTimeoutInSeconds = 2
    const event = {
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { key: 'value_2' },
      created_at: new Date(),
      updated_at: new Date(),
    }
    const subscriber = {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: retryTimeoutInSeconds, concurrency: 1 },
    }

    await nixEventsInMemory.subscribe('another_event_type', subscriber)
    await nixEventsInMemory.put({ event })
    await nixEventsInMemory.findNextEventsFor(subscriber)

    await nixEventsInMemory.markAsFailed({
      event,
      subscriber,
    })
    await nixEventsInMemory.markAsFailed({
      event,
      subscriber,
    })

    await wait(retryTimeoutInSeconds * 1000)
    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('mark the event as failed and exceeds retries', async () => {
    const retryTimeoutInSeconds = 2
    const event = {
      id: 'another_event_id',
      type: 'another_event_type',
      payload: { key: 'value_2' },
      created_at: new Date(),
      updated_at: new Date(),
    }
    const subscriber = {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: retryTimeoutInSeconds, concurrency: 1 },
    }

    await nixEventsInMemory.subscribe('another_event_type', subscriber)
    await nixEventsInMemory.put({ event })
    await nixEventsInMemory.findNextEventsFor(subscriber)

    await nixEventsInMemory.markAsFailed({
      event,
      subscriber,
    })
    await nixEventsInMemory.markAsFailed({
      event,
      subscriber,
    })
    await nixEventsInMemory.markAsFailed({
      event,
      subscriber,
    })

    await wait(retryTimeoutInSeconds * 1000)
    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()
    const deadEvents = await nixEventsInMemory.getAllDeadEventsTypesAndPayloads()

    expect({ events, deadEvents }).verify()
  })

  test('get all events types and payloads', async () => {
    await nixEventsInMemory.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await nixEventsInMemory.subscribe('another_event_type', {
      id: 'another_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })

    await nixEventsInMemory.put({
      event: {
        id: 'an_event_id',
        type: 'an_event_type',
        payload: { key: 'value' },
      },
    })
    await nixEventsInMemory.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })

  test('get all events types and payloads with no duplicates', async () => {
    await nixEventsInMemory.subscribe('an_event_type', {
      id: 'a_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await nixEventsInMemory.subscribe('an_event_type', {
      id: 'another_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })
    await nixEventsInMemory.subscribe('another_event_type', {
      id: 'any_other_subscriber_id',
      config: { maxRetries: 3, timeout: 10, concurrency: 1 },
    })

    await nixEventsInMemory.put({
      event: {
        id: 'an_event_id',
        type: 'an_event_type',
        payload: { key: 'value' },
      },
    })
    await nixEventsInMemory.put({
      event: {
        id: 'another_event_id',
        type: 'another_event_type',
        payload: { key: 'value_2' },
      },
    })

    const events = await nixEventsInMemory.getAllEventsTypesAndPayloads()

    expect(events).verify()
  })
})

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

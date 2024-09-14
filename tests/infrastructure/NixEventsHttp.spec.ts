import type { Mock } from 'node:test'
import { mock } from 'node:test'

import { expect } from '@playwright/test'
import { test } from 'playwright/test'

import { Logger } from 'src/infrastructure/Logger'
import { NixBusHttpClient } from 'src/infrastructure/NixBusHttpClient'
import { NixEventsHttp } from 'src/infrastructure/NixEventsHttp'

test.describe('NixEventsHttp', () => {
  let nixEventsHttp: NixEventsHttp
  let nixBusHttpClient: NixBusHttpClient

  const event = {
    id: 'an_event_id',
    type: 'an_event_type',
    payload: { key: 'value_1' },
    created_at: new Date(),
    updated_at: new Date(),
  }
  const anotherEvent = {
    id: 'another_event_id',
    type: 'an_event_type',
    payload: { key: 'value_2' },
    created_at: new Date(),
    updated_at: new Date(),
  }
  const anyOtherEvent = {
    id: 'any_other_event_id',
    type: 'an_event_type',
    payload: { key: 'value_3' },
    created_at: new Date(),
    updated_at: new Date(),
  }
  const oneMoreEvent = {
    id: 'one_more_event_id',
    type: 'an_event_type',
    payload: { key: 'value_4' },
    created_at: new Date(),
    updated_at: new Date(),
  }

  const subscriber = {
    id: 'a_subscriber_id',
    config: { maxRetries: 3, timeout: 10, concurrency: 1 },
  }

  test.beforeEach(() => {
    nixBusHttpClient = new NixBusHttpClient(
      {
        crypto: null,
        logger: new Logger(),
      },
      {
        token: 'a_token',
      },
    )
    nixEventsHttp = new NixEventsHttp({
      client: nixBusHttpClient,
    })
  })

  test('publish events batching the events', async () => {
    mock.method(nixBusHttpClient, 'publishEvents', async () => wait(100))

    await Promise.all([
      nixEventsHttp.put({
        event,
      }),
      nixEventsHttp.put({
        event: anotherEvent,
      }),
      nixEventsHttp.put({
        event: anyOtherEvent,
      }),
      nixEventsHttp.put({
        event: oneMoreEvent,
      }),
    ])

    const publishEvents = nixBusHttpClient.publishEvents as Mock<any>
    expect(publishEvents.mock.callCount()).toEqual(2)
    expect(publishEvents.mock.calls[0].arguments).toEqual([
      {
        events: [
          {
            payload: {
              key: 'value_1',
            },
            type: 'an_event_type',
          },
        ],
      },
    ])
    expect(publishEvents.mock.calls[1].arguments).toEqual([
      {
        events: [
          {
            payload: {
              key: 'value_2',
            },
            type: 'an_event_type',
          },
          {
            payload: {
              key: 'value_3',
            },
            type: 'an_event_type',
          },
          {
            payload: {
              key: 'value_4',
            },
            type: 'an_event_type',
          },
        ],
      },
    ])
  })

  test('mark events as finished batching the events', async () => {
    mock.method(nixBusHttpClient, 'markEventsAsFinished', async () => wait(100))

    await Promise.all([
      nixEventsHttp.markAsFinished({
        event,
        subscriber,
      }),
      nixEventsHttp.markAsFinished({
        event: anotherEvent,
        subscriber,
      }),
      nixEventsHttp.markAsFinished({
        event: anyOtherEvent,
        subscriber,
      }),
      nixEventsHttp.markAsFinished({
        event: oneMoreEvent,
        subscriber,
      }),
    ])

    const markEventsAsFinished = nixBusHttpClient.markEventsAsFinished as Mock<any>
    expect(markEventsAsFinished.mock.callCount()).toEqual(2)
    expect(markEventsAsFinished.mock.calls[0].arguments).toEqual([
      {
        events: [{ id: 'an_event_id', subscriberId: 'a_subscriber_id' }],
      },
    ])
    expect(markEventsAsFinished.mock.calls[1].arguments).toEqual([
      {
        events: [
          { id: 'another_event_id', subscriberId: 'a_subscriber_id' },
          { id: 'any_other_event_id', subscriberId: 'a_subscriber_id' },
          { id: 'one_more_event_id', subscriberId: 'a_subscriber_id' },
        ],
      },
    ])
  })

  test('mark events as failed batching the events', async () => {
    mock.method(nixBusHttpClient, 'markEventsAsFailed', async () => wait(100))

    await Promise.all([
      nixEventsHttp.markAsFailed({
        event,
        subscriber,
      }),
      nixEventsHttp.markAsFailed({
        event: anotherEvent,
        subscriber,
      }),
      nixEventsHttp.markAsFailed({
        event: anyOtherEvent,
        subscriber,
      }),
      nixEventsHttp.markAsFailed({
        event: oneMoreEvent,
        subscriber,
      }),
    ])

    const markEventsAsFailed = nixBusHttpClient.markEventsAsFailed as Mock<any>
    expect(markEventsAsFailed.mock.callCount()).toEqual(2)
    expect(markEventsAsFailed.mock.calls[0].arguments).toEqual([
      {
        events: [{ id: 'an_event_id', subscriberId: 'a_subscriber_id' }],
      },
    ])
    expect(markEventsAsFailed.mock.calls[1].arguments).toEqual([
      {
        events: [
          { id: 'another_event_id', subscriberId: 'a_subscriber_id' },
          { id: 'any_other_event_id', subscriberId: 'a_subscriber_id' },
          { id: 'one_more_event_id', subscriberId: 'a_subscriber_id' },
        ],
      },
    ])
  })
})

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

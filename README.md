# NixBus Event Bus

NixBus Event Bus is a secure, robust, and efficient event bus over HTTP. This JavaScript SDK allows you to integrate NixBus into your applications seamlessly, enabling decoupled event-driven architectures. Ideal for microservices, this SDK supports event publishing, subscribing, and processing with ease.

![Awt7xreeDXMZ7WiYiGACiLjm](https://github.com/user-attachments/assets/9ed8978a-3f3f-4280-8ea9-4d3bcd09af2d)

## Features

- **Simple Integration:** Easily add NixBus to your project using NixBus NPM package.
- **Secure Communication:** End-to-end encryption ensures your event data is safe.
- **Scalable:** Handle events across multiple microservices and locations.
- **In-Memory Option:** Use the in-memory event bus for smaller applications.
- **Detailed Monitoring:** Monitor your event usage and system performance in real-time via [NixBus dashboard](https://nixbus.com/dashboard).

## Installation

To install the NixBus Event Bus SDK, run the following command:

```bash
npm install @nixbus/event-bus --save -E
```

## Usage

### Subscribing to Events and running the event bus

```javascript
import { getNixBusHttp } from '@nixbus/event-bus'

const nixbus = getNixBusHttp({
  token: 'your_token',
  passphrase: 'your_passphrase',
})

await nixbus.subscribe('event_type', {
  id: 'a_subscriber_id',
  action: async (event) => {
    console.log('Received event:', event)
    // Process the event
  },
  config: { maxRetries: 3, timeout: 10, concurrency: 500 },
})

nixbus.run()
```

### Subscribing to Events with `deadAction` and running the event bus

```javascript
import { getNixBusHttp } from '@nixbus/event-bus'

const nixbus = getNixBusHttp({
  token: 'your_token',
  passphrase: 'your_passphrase',
})

await nixbus.subscribe('event_type', {
  id: 'a_subscriber_id',
  action: async (event) => {
    console.log('Processing event:', event)
    // Your business logic
  },
  deadAction: async (event) => {
    console.log('Dead event encountered:', event)
    // Handle events that reach maxRetries
  },
  config: { maxRetries: 3, timeout: 10, concurrency: 500 },
})

nixbus.run()
```

### Publishing events

```javascript
import { getNixBusHttp } from '@nixbus/event-bus'

const nixbus = getNixBusHttp({
  token: 'your_token',
  passphrase: 'your_passphrase',
})

await nixbus.publish({
  type: 'event_type',
  payload: { welcome: 'to the event bus' },
})
```

## Key Concepts

### Timeout

- Events must be processed by the subscriber's `action` within the configured `timeout`.
- If an event is not processed (marked as finished or failed) within this timeout, it will be re-delivered for processing.
- This ensures no events are lost, even in cases of temporary subscriber issues.

### maxRetries

- Defines the maximum number of retry attempts for a subscriber's `action`.
- If the `action` fails repeatedly and reaches the `maxRetries` limit, the event is considered a "dead event."
- Dead events trigger the optional `deadAction`, providing a chance for compensatory handling or logging.

### Automatic Event Marking

The library automatically manages the lifecycle of events:

- **Finished**: If the `action` completes successfully without errors, the event is marked as finished and will not be re-delivered.
- **Failed**: If the `action` throws an error or fails to process the event, the event is marked as failed and remains eligible for retry until maxRetries is reached.
- **DeadAction Handling**:
  - If the event exceeds `maxRetries`, the `deadAction` (if defined) is triggered.
  - After the `deadAction` runs (whether it succeeds or throws an error), the event is marked as finished and will not be re-delivered.

### Behavior When `deadAction` Is Not Defined

- If no `deadAction` is defined for the subscriber, the event will remain unmarked after reaching `maxRetries`.
- This means:
  - The event will stay in the dead-letter queue but will not be processed further.
  - Increasing the subscriber's `maxRetries` will allow the event to be reprocessed. The action will run again for the event until it is successfully processed or reaches the new `maxRetries`.

### DeadAction

- **Purpose**: Allows you to define custom handling for events that exceed their retry limits. Common use cases include logging, notifying administrators, or archiving data for manual inspection.
- **Execution**: Runs only once when an event reaches the retry limit. After execution, the event is marked as finished.
- Optional: If no `deadAction` is defined, events remain in the dead-letter queue and can be reprocessed by increasing the `maxRetries`.

## Examples

Check out the [examples folder](/examples) for more usage examples. These examples can help you test and understand how to implement NixBus in your projects.

## API Documentation

For more detailed information on using the [NixBus HTTP API](https://nixbus.com/api), or if you want to create your own implementation or build SDKs in other languages, please refer to [NixBus API documentation](https://nixbus.com/api).

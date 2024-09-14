# NixBus Event Bus

NixBus Event Bus is a secure, robust, and efficient event bus over HTTP. This JavaScript SDK allows you to integrate NixBus into your applications seamlessly, enabling decoupled event-driven architectures. Ideal for microservices, this SDK supports event publishing, subscribing, and processing with ease.

![VhJM18RjcpLdWsHFSNhEVAiB](https://github.com/user-attachments/assets/908f2662-c2e2-4c12-95d3-3f23f257aba8)

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

## Examples
Check out the [examples folder](/examples) for more usage examples. These examples can help you test and understand how to implement NixBus in your projects.

## API Documentation

For more detailed information on using the [NixBus HTTP API](https://nixbus.com/api), or if you want to create your own implementation or build SDKs in other languages, please refer to [NixBus API documentation](https://nixbus.com/api).

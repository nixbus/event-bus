import { getNixBusHttp } from '@nixbus/event-bus'

import { SendPageViewedNotification } from 'src/actions/SendPageViewedNotification'
import { UpdatePageViewedAnalytics } from 'src/actions/UpdatePageViewedAnalytics'
import { PageViewed } from 'src/events/PageViewed'
import { getEnvVar } from 'src/shared/env'

async function main() {
  const bus = getNixBusHttp({
    token: getEnvVar('NIXBUS_TOKEN'),
    passphrase: getEnvVar('NIXBUS_PASSPHRASE'),
  })

  await bus.unsubscribeAll()
  await Promise.all([
    bus.subscribe(PageViewed.getEventType(), {
      id: SendPageViewedNotification.name,
      action: SendPageViewedNotification,
      config: { maxRetries: 3, timeout: 30, concurrency: 10 },
    }),
    bus.subscribe(PageViewed.getEventType(), {
      id: UpdatePageViewedAnalytics.name,
      action: UpdatePageViewedAnalytics,
      config: { maxRetries: 3, timeout: 30, concurrency: 10 },
    }),
  ])

  bus
    .run()
    .then(() => console.log('[Consumer] Running NixBus...'))
    .catch((error) => console.error('[Consumer] Error:', error))
}

main().catch(console.error)

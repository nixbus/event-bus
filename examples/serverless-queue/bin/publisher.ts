import { getNixBusHttp } from '@nixbus/event-bus'

import { PageViewed } from 'src/events/PageViewed'
import { getEnvVar } from 'src/shared/env'

async function main() {
  const bus = getNixBusHttp({
    token: getEnvVar('NIXBUS_TOKEN'),
    passphrase: getEnvVar('NIXBUS_PASSPHRASE'),
  })

  while (true) {
    const title = `Title ${getTitleId()}`
    console.log(`[Publisher] Publishing ${PageViewed.getEventType()}: ${title}`)
    await bus.publish(
      PageViewed.create({
        title,
      }),
    )
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

let titleId = 1
function getTitleId(): number {
  return titleId++
}

main().catch(console.error)

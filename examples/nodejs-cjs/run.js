const { getHttpNixBus } = require('@nixbus/event-bus')

async function main() {
  const bus = getHttpNixBus({
    token: process.env.NIXBUS_TOKEN,
    passphrase: process.env.NIXBUS_PASSPHRASE,
  })

  bus.run()
}

main().catch(console.error)

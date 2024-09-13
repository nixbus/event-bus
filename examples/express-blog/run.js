import { getNixBusInMemory } from '@nixbus/event-bus'
import express from 'express'

const BLOG_POST_VISITED_EVENT = 'post-visited'

let eventId = 1
async function runServer() {
  const app = express()
  const port = 3000

  app.get('/', (req, res) => {
    const home = [
      '<h1>Home</h1>',
      '<p>Posts</p>',
      '<ul>',
      '<li><a href="/blog/a-post">A Post</a></li>',
      '</ul>',
    ].join('')

    res.send(home)
  })

  app.get('/blog/a-post', (req, res) => {
    const post = [
      '<h1>A Post</h1>',
      '<p>Some content</p>',
      '<p>Some more content</p>',
      '<p><i>An internal event is published because you are visiting that page.</i></p>',
    ].join('')

    const bus = getNixBusInMemory()
    bus.publish({
      id: `${eventId++}`,
      type: BLOG_POST_VISITED_EVENT,
      payload: {
        postSlug: 'a-post',
      },
    })

    res.send(post)
  })

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

async function runEventBus() {
  const bus = getNixBusInMemory()

  await bus.subscribe(BLOG_POST_VISITED_EVENT, {
    id: 'post-visited-subscriber',
    action: async (event) => {
      console.log('Received event:', event)
    },
    config: { maxRetries: 3, timeout: 10, concurrency: 500 },
  })

  bus.run()
}

async function main() {
  await runEventBus()
  await runServer()
}

main().catch(console.error)

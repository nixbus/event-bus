type Interval = {
  id: any
  run: boolean
}
const asyncIntervals: { [key: number]: Interval } = {}

let lastIntervalId = 0
export function setAsyncInterval(fn: () => Promise<void>, ms: number) {
  const intervalId = lastIntervalId++
  asyncIntervals[intervalId] = { id: null, run: true }
  runAsyncInterval(fn, ms, intervalId)
  return intervalId
}

export function clearAsyncInterval(id: number) {
  const interval = asyncIntervals[id]
  if (interval && interval.run) {
    if (interval.id) clearTimeout(interval.id)
    interval.run = false
    delete asyncIntervals[id]
  }
}

async function runAsyncInterval(fn: () => Promise<void>, ms: number, id: number) {
  try {
    await fn()
    const interval = asyncIntervals[id]
    if (interval && interval.run) {
      interval.id = setTimeout(() => runAsyncInterval(fn, ms, id), ms)
    }
  } catch (error) {
    console.error('[async-interval] error:', error)
    delete asyncIntervals[id]
  }
}

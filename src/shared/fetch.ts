type FetchOptions = RequestInit & {
  retryCount?: number
}

export async function fetchJson(url: string, options: FetchOptions): Promise<Response> {
  try {
    const response = await fetchWithJsonHeaders(url, options)

    if (!response.ok) {
      throw new Error(`Error: ${url} - ${response.status} - ${response.statusText}`)
    }

    return response
  } catch (error: any) {
    return handleFetchError(url, options, error)
  }
}

async function fetchWithJsonHeaders(url: string, options: RequestInit): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  })
}

async function handleFetchError(url: string, options: FetchOptions, error: any): Promise<Response> {
  const MAX_RETRIES = 3
  const retryCount = options.retryCount ?? 0

  if (error.message.includes('socket hang up') && retryCount < MAX_RETRIES) {
    console.warn(`[fetch] Retrying fetch in 1s (${retryCount + 1}/${MAX_RETRIES})`, url)
    await wait(1000)
    return fetchJson(url, { ...options, retryCount: retryCount + 1 })
  }

  console.error(`[fetch] error:`, url, error)
  throw error
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
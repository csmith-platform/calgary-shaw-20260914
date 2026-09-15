const SOURCE_URL = 'https://results.elections.ab.ca/data/8486?version=3.0.0&wards=23'

export async function onRequestGet() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        accept: 'application/json',
        'user-agent': 'calgary-shaw-geointel/0.1',
      },
      cf: { cacheTtl: 10, cacheEverything: true },
    })

    if (!response.ok) {
      return Response.json(
        { success: false, error: `Elections Alberta returned ${response.status}` },
        { status: 502, headers: { 'cache-control': 'no-store' } },
      )
    }

    const data = await response.json()
    return Response.json(data, {
      headers: {
        'cache-control': 'public, max-age=10, stale-while-revalidate=20',
        'access-control-allow-origin': '*',
      },
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown proxy error' },
      { status: 502, headers: { 'cache-control': 'no-store' } },
    )
  }
}

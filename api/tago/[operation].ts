export const config = {
  runtime: 'edge',
}

const TAGO_BASE = 'https://apis.data.go.kr/1613000/TrainInfo'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function readTagoServiceKey(): string | null {
  const raw = process.env.TAGO_SERVICE_KEY ?? process.env.VITE_TAGO_SERVICE_KEY
  const key = raw?.trim()
  return key ? key : null
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const key = readTagoServiceKey()
  if (!key) {
    return new Response('Missing TAGO_SERVICE_KEY', {
      status: 500,
      headers: corsHeaders,
    })
  }

  const url = new URL(request.url)
  const operation = url.pathname.split('/').pop()?.trim()
  if (!operation) {
    return new Response('Missing operation', { status: 400, headers: corsHeaders })
  }

  const upstreamUrl = new URL(`${TAGO_BASE}/${operation}`)
  url.searchParams.forEach((value, name) => {
    if (name === 'serviceKey') return
    upstreamUrl.searchParams.set(name, value)
  })
  upstreamUrl.searchParams.set('serviceKey', key)

  const upstream = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  })

  const headers = new Headers(corsHeaders)
  headers.set(
    'Content-Type',
    upstream.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
  )

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}

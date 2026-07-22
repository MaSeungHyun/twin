export const config = {
  runtime: 'edge',
};

const RELEASE_TAG = 'v0.0.0';
const REPO = 'MaSeungHyun/twin';

const MODEL_FILE_PATTERN = /^model\d+\.glb$/;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const { pathname } = new URL(request.url);
  const file = pathname.split('/').pop() ?? '';

  if (!MODEL_FILE_PATTERN.test(file)) {
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }

  const upstream = await fetch(
    `https://github.com/${REPO}/releases/download/${RELEASE_TAG}/${file}`,
    { redirect: 'follow' },
  );

  if (!upstream.ok) {
    return new Response('Upstream error', {
      status: upstream.status,
      headers: corsHeaders,
    });
  }

  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'model/gltf-binary');
  const length = upstream.headers.get('Content-Length');
  if (length) headers.set('Content-Length', length);
  headers.set('Cache-Control', 'public, max-age=3600');

  return new Response(upstream.body, { status: 200, headers });
}

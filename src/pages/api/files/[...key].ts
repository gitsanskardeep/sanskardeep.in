import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;

  if (!key) {
    return new Response(JSON.stringify({ error: 'File key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const env = locals.runtime?.env;

  if (!env?.R2_BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 Storage bucket binding not available in runtime environment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const object = await env.R2_BUCKET.get(key);

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
    headers.set('ETag', object.httpEtag);

    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to retrieve file', details: err?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

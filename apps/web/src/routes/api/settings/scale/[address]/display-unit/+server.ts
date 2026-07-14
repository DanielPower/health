import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export const PUT = async ({ fetch, params, request }) => {
  const response = await fetch(`${env.COLLECTOR_URL}/v1/scales/${params.address}/display-unit`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
  const body = await response.text();

  try {
    return json(JSON.parse(body), { status: response.status });
  } catch {
    return json(
      { detail: body || `Scale collector returned HTTP ${response.status}` },
      { status: response.ok ? 502 : response.status },
    );
  }
};

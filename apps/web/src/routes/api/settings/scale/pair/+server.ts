import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export const POST = async ({ fetch, request }) => {
  const response = await fetch(`${env.COLLECTOR_URL}/v1/scales/pair`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });
  return json(await response.json(), { status: response.status });
};

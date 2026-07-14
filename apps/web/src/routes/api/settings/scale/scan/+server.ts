import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export const POST = async ({ fetch }) => {
  const response = await fetch(`${env.COLLECTOR_URL}/v1/scales/scan`, { method: 'POST' });
  return json(await response.json(), { status: response.status });
};

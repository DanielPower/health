import { database } from '$lib/server/database';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export const PUT = async ({ params, request }) => {
  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== 'object' ||
    !('display_unit' in body) ||
    (body.display_unit !== 'kg' && body.display_unit !== 'lb')
  ) {
    return json({ detail: 'display_unit must be "kg" or "lb"' }, { status: 422 });
  }

  const result = await database.query<{ weight_display_unit: 'kg' | 'lb' }>(
    "UPDATE scale_devices SET weight_display_unit = $2 WHERE bluetooth_address = $1 RETURNING weight_display_unit",
    [params.address, body.display_unit],
  );
  if (result.rowCount === 0) {
    return json({ detail: 'Scale is not paired' }, { status: 404 });
  }

  const collectorResponse = await fetch(
    `${env.COLLECTOR_URL}/v1/scales/${params.address}/display-unit`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ display_unit: body.display_unit }),
    },
  );
  if (!collectorResponse.ok) {
    const detail = await collectorResponse.text();
    return json(
      {
        detail:
          detail ||
          'Preference saved, but the collector could not update the scale display right now.',
      },
      { status: 503 },
    );
  }
  return json(result.rows[0]);
};

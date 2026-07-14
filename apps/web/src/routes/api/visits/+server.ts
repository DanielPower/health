import { database } from '$lib/server/database';
import { json } from '@sveltejs/kit';

export const POST = async () => {
  const result = await database.query<{ count: string }>(`
    INSERT INTO site_counters (counter_key, count)
    VALUES ('page_loads', 1)
    ON CONFLICT (counter_key) DO UPDATE SET count = site_counters.count + 1
    RETURNING count
  `);

  return json({ count: result.rows[0].count });
};

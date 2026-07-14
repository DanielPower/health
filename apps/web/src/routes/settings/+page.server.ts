import { database } from '$lib/server/database';

export const load = async () => {
  const result = await database.query<{
    bluetooth_address: string;
    name: string;
    model: string;
  }>("SELECT bluetooth_address, name, model FROM scale_devices ORDER BY paired_at");

  return { pairedDevices: result.rows };
};

import { database } from '$lib/server/database';

export const load = async () => {
  const result = await database.query<{
    bluetooth_address: string;
    name: string;
    model: string;
    weight_display_unit: 'kg' | 'lb';
  }>("SELECT bluetooth_address, name, model, weight_display_unit FROM scale_devices WHERE is_active ORDER BY paired_at");

  return { pairedDevices: result.rows };
};

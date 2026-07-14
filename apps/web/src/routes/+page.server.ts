import { database } from '$lib/server/database';

export const load = async () => {
  const result = await database.query<{
    measured_at: Date;
    weight_kg: string;
    impedance_ohms: number | null;
    device_name: string;
  }>(`
    SELECT m.measured_at, m.weight_kg, m.impedance_ohms, d.name AS device_name
    FROM scale_measurements m
    JOIN scale_devices d ON d.id = m.scale_device_id
    ORDER BY m.measured_at DESC
    LIMIT 100
  `);

  return { measurements: result.rows };
};

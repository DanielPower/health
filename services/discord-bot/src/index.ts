import { Client, Events, GatewayIntentBits } from 'discord.js';
import pg from 'pg';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
};

const database = new pg.Pool({ connectionString: required('DATABASE_URL') });
const channelId = required('CHANNEL_ID');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let checking = false;

type Measurement = {
  id: string;
  weight_kg: string;
  weight_display_unit: 'kg' | 'lb';
  measured_at: Date;
  created_at: Date;
};

const checkForNewLow = async () => {
  if (checking) return;
  checking = true;

  try {
    const pending = await database.query<Measurement>(`
      SELECT m.id, m.weight_kg, d.weight_display_unit, m.measured_at, m.created_at
      FROM scale_measurements m
      JOIN scale_devices d ON d.id = m.scale_device_id
      LEFT JOIN discord_weight_notifications n ON n.measurement_id = m.id
      WHERE n.measurement_id IS NULL
      ORDER BY m.created_at
      LIMIT 1
    `);
    const measurement = pending.rows[0];
    if (!measurement) return;

    const previous = await database.query<{ minimum: string | null }>(
      "SELECT min(weight_kg)::text AS minimum FROM scale_measurements WHERE created_at < $1",
      [measurement.created_at],
    );
    const isNewLow =
      previous.rows[0].minimum === null || Number(measurement.weight_kg) < Number(previous.rows[0].minimum);

    if (isNewLow) {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isSendable()) {
        throw new Error(`CHANNEL_ID ${channelId} is not a sendable text channel`);
      }
      const displayedWeight =
        Number(measurement.weight_kg) * (measurement.weight_display_unit === 'lb' ? 2.2046226218 : 1);
      const unit = measurement.weight_display_unit === 'lb' ? 'lbs' : 'kg';
      await channel.send(`📉 **New lowest weight achieved:** ${displayedWeight.toFixed(2)} ${unit}!`);
    }

    await database.query(
      "INSERT INTO discord_weight_notifications (measurement_id, announced_at) VALUES ($1, $2)",
      [measurement.id, isNewLow ? new Date() : null],
    );
  } finally {
    checking = false;
  }
};

client.once(Events.ClientReady, async (readyClient) => {
  console.info(`Discord bot connected as ${readyClient.user.tag}`);
  await checkForNewLow();
  setInterval(() => void checkForNewLow(), 15_000);
});

client.login(required('DISCORD_TOKEN')).catch(async (error: unknown) => {
  console.error('Discord bot failed to start', error);
  await database.end();
  process.exitCode = 1;
});

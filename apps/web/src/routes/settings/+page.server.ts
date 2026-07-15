import { database } from '$lib/server/database';
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';

export const load = async () => {
  const result = await database.query<{
    bluetooth_address: string;
    name: string;
    model: string;
    weight_display_unit: 'kg' | 'lb';
  }>("SELECT bluetooth_address, name, model, weight_display_unit FROM scale_devices WHERE is_active ORDER BY paired_at");

  const aiResult = await database.query<{
    provider: 'openai' | 'anthropic';
    model: string;
    has_api_key: boolean;
  }>("SELECT provider, model, api_key_encrypted IS NOT NULL AS has_api_key FROM ai_configuration WHERE singleton");

  return { pairedDevices: result.rows, aiConfiguration: aiResult.rows[0] ?? null };
};

export const actions = {
  saveAi: async ({ request }) => {
    if (!env.APP_ENCRYPTION_KEY) return fail(500, { aiError: 'APP_ENCRYPTION_KEY is not configured.' });
    const form = await request.formData();
    const provider = form.get('provider');
    const model = form.get('model');
    const apiKey = form.get('api_key');
    const trimmedApiKey = typeof apiKey === 'string' ? apiKey.trim() : '';
    if (
      (provider !== 'openai' && provider !== 'anthropic') ||
      typeof model !== 'string' ||
      model.trim().length === 0 ||
      model.length > 200
    ) {
      return fail(422, { aiError: 'Choose a provider and model.' });
    }
    if (trimmedApiKey) {
      await database.query(
        `
          INSERT INTO ai_configuration (singleton, provider, model, api_key_encrypted)
          VALUES (true, $1, $2, pgp_sym_encrypt($3, $4))
          ON CONFLICT (singleton) DO UPDATE SET
            provider = EXCLUDED.provider,
            model = EXCLUDED.model,
            api_key_encrypted = EXCLUDED.api_key_encrypted,
            updated_at = now()
        `,
        [provider, model.trim(), trimmedApiKey, env.APP_ENCRYPTION_KEY],
      );
    } else {
      const result = await database.query(
        'UPDATE ai_configuration SET provider = $1, model = $2, updated_at = now() WHERE singleton',
        [provider, model.trim()],
      );
      if (result.rowCount === 0) {
        return fail(422, { aiError: 'Enter an API key to create the AI configuration.' });
      }
    }
    return { aiSuccess: 'AI configuration saved.' };
  },
};

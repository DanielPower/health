import { env } from '$env/dynamic/private';
import { database } from '$lib/server/database';

type Provider = 'openai' | 'anthropic';

type AiConfiguration = {
  provider: Provider;
  model: string;
  api_key: string;
};

type MealEstimate = {
  calories: number;
  explanation: string;
};

const systemPrompt = `Estimate the calories in a meal description. Return JSON only, with integer calories and a short explanation. Estimate a reasonable single serving when portion size is unclear. This is an estimate, not medical advice.`;

const parseEstimate = (content: string): MealEstimate => {
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('The AI returned an invalid calorie estimate.');
  }

  const { calories, explanation } = parsed as Record<string, unknown>;
  if (
    typeof calories !== 'number' ||
    !Number.isInteger(calories) ||
    calories < 1 ||
    calories > 10000 ||
    typeof explanation !== 'string'
  ) {
    throw new Error('The AI returned an invalid calorie estimate.');
  }

  return { calories, explanation: explanation.slice(0, 500) };
};

const getConfiguration = async (): Promise<AiConfiguration> => {
  if (!env.APP_ENCRYPTION_KEY) throw new Error('APP_ENCRYPTION_KEY is not configured.');
  const result = await database.query<AiConfiguration>(
    `
      SELECT provider, model,
        pgp_sym_decrypt(api_key_encrypted, $1)::text AS api_key
      FROM ai_configuration
      WHERE singleton
    `,
    [env.APP_ENCRYPTION_KEY],
  );
  const configuration = result.rows[0];
  if (!configuration) throw new Error('Configure an AI provider and API key in Settings first.');
  return configuration;
};

const estimateWithOpenAi = async (configuration: AiConfiguration, description: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${configuration.api_key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: configuration.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'OpenAI estimation failed.');
  return parseEstimate(body.choices?.[0]?.message?.content ?? '');
};

const estimateWithAnthropic = async (configuration: AiConfiguration, description: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'x-api-key': configuration.api_key,
    },
    body: JSON.stringify({
      model: configuration.model,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: description }],
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message ?? 'Anthropic estimation failed.');
  return parseEstimate(body.content?.[0]?.text ?? '');
};

export const estimateMealCalories = async (description: string): Promise<MealEstimate> => {
  const configuration = await getConfiguration();
  return configuration.provider === 'openai'
    ? estimateWithOpenAi(configuration, description)
    : estimateWithAnthropic(configuration, description);
};

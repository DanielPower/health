import { database } from '$lib/server/database';
import { fail, redirect } from '@sveltejs/kit';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);

const validDate = (value: FormDataEntryValue | null): value is string =>
  typeof value === 'string' && isoDate.test(value);

export const load = async ({ url }) => {
  const date = url.searchParams.get('date');
  const selectedDate = date && isoDate.test(date) ? date : today();
  const result = await database.query<{
    id: string;
    meal: string;
    description: string;
    calories: number;
  }>(
    `
      SELECT id, meal, description, calories
      FROM calorie_entries
      WHERE entry_date = $1
      ORDER BY created_at, id
    `,
    [selectedDate],
  );

  return {
    selectedDate,
    entries: result.rows,
    total: result.rows.reduce((sum, entry) => sum + entry.calories, 0),
  };
};

export const actions = {
  add: async ({ request }) => {
    const form = await request.formData();
    const date = form.get('date');
    const meal = form.get('meal');
    const description = form.get('description');
    const calories = Number(form.get('calories'));

    if (
      !validDate(date) ||
      !['breakfast', 'lunch', 'dinner', 'snack'].includes(String(meal)) ||
      typeof description !== 'string' ||
      description.trim().length === 0 ||
      description.length > 200 ||
      !Number.isInteger(calories) ||
      calories < 1 ||
      calories > 10000
    ) {
      return fail(422, { error: 'Enter a meal, a description, and a calorie value from 1 to 10,000.' });
    }

    await database.query(
      "INSERT INTO calorie_entries (entry_date, meal, description, calories) VALUES ($1, $2, $3, $4)",
      [date, meal, description.trim(), calories],
    );
    throw redirect(303, `/calories?date=${date}`);
  },

  delete: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id');
    const date = form.get('date');
    if (typeof id === 'string') await database.query('DELETE FROM calorie_entries WHERE id = $1', [id]);
    throw redirect(303, `/calories?date=${validDate(date) ? date : today()}`);
  },
};

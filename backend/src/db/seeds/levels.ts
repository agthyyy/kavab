import type { Knex } from 'knex';

const LEVELS = [
  { name: 'Novice', xp_required: 0, order_index: 1 },
  { name: 'Coffee Apprentice', xp_required: 100, order_index: 2 },
  { name: 'Barista', xp_required: 300, order_index: 3 },
  { name: 'Espresso Master', xp_required: 600, order_index: 4 },
  { name: 'Coffee Guru', xp_required: 1000, order_index: 5 },
  { name: 'Kavabanga Legend', xp_required: 2000, order_index: 6 },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('levels').del();
  await knex('levels').insert(LEVELS);
}

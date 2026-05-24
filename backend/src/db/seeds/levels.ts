import type { Knex } from 'knex';

const LEVELS = [
  { name: 'Level 1', xp_required: 0, order_index: 1 },
  { name: 'Level 2', xp_required: 600, order_index: 2 },
  { name: 'Level 3', xp_required: 1200, order_index: 3 },
  { name: 'Level 4', xp_required: 1800, order_index: 4 },
  { name: 'Level 5', xp_required: 2400, order_index: 5 },
  { name: 'Level 6', xp_required: 3000, order_index: 6 },
  { name: 'Level 7', xp_required: 3600, order_index: 7 },
  { name: 'Level 8', xp_required: 4200, order_index: 8 },
  { name: 'Level 9', xp_required: 4800, order_index: 9 },
  { name: 'Level 10', xp_required: 5400, order_index: 10 },
  { name: 'Level 11', xp_required: 6000, order_index: 11 },
  { name: 'Level 12', xp_required: 6600, order_index: 12 },
  { name: 'Level 13', xp_required: 7200, order_index: 13 },
  { name: 'Level 14', xp_required: 7800, order_index: 14 },
  { name: 'Level 15', xp_required: 8400, order_index: 15 },
  { name: 'Level 16', xp_required: 9000, order_index: 16 },
  { name: 'Level 17', xp_required: 9600, order_index: 17 },
  { name: 'Level 18', xp_required: 10200, order_index: 18 },
  { name: 'Level 19', xp_required: 10800, order_index: 19 },
  { name: 'Level 20', xp_required: 11400, order_index: 20 },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('levels').del();
  await knex('levels').insert(LEVELS);
}

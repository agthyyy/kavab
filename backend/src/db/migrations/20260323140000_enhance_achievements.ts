import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add new columns to achievements table
  await knex.schema.alterTable('achievements', (table) => {
    table.string('icon', 10).defaultTo('🏆');
    table.string('rarity', 20).defaultTo('common'); // common, rare, epic, legendary
    table.integer('xp_reward').defaultTo(0);
    table.integer('progress_current').defaultTo(0); // for tracking progress
    table.integer('progress_total').defaultTo(1); // total needed for completion
    table.boolean('is_secret').defaultTo(false);
    table.string('category', 50).defaultTo('general'); // general, speed, social, mastery, special
  });

  // Add progress_at_earn to user_achievements (earned_at already exists)
  await knex.schema.alterTable('user_achievements', (table) => {
    table.integer('progress_at_earn').defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('achievements', (table) => {
    table.dropColumn('icon');
    table.dropColumn('rarity');
    table.dropColumn('xp_reward');
    table.dropColumn('progress_current');
    table.dropColumn('progress_total');
    table.dropColumn('is_secret');
    table.dropColumn('category');
  });

  await knex.schema.alterTable('user_achievements', (table) => {
    table.dropColumn('progress_at_earn');
  });
}

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_progress', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.integer('total_xp').notNullable().defaultTo(0);
    table.integer('level_id').references('id').inTable('levels').onDelete('SET NULL').nullable();
    table.integer('streak').notNullable().defaultTo(0);
    table.date('last_activity_date').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_progress');
}

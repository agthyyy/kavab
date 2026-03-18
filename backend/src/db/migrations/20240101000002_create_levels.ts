import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('levels', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.integer('xp_required').notNullable();
    table.integer('order_index').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('levels');
}

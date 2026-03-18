import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lessons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('module_id').notNullable().references('id').inTable('modules').onDelete('CASCADE');
    table.string('title', 300).notNullable();
    table.integer('order_index').notNullable();
    table.integer('xp_reward').notNullable().defaultTo(10);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lessons');
}

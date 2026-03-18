import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('modules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('title', 300).notNullable();
    table.integer('order_index').notNullable();
    table
      .integer('pass_threshold')
      .notNullable()
      .defaultTo(80)
      .checkBetween([1, 100], 'modules_pass_threshold_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('modules');
}

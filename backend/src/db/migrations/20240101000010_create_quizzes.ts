import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('quizzes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('module_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('modules')
      .onDelete('CASCADE');
    table.integer('xp_max').notNullable().defaultTo(50);
    table
      .integer('pass_threshold')
      .notNullable()
      .defaultTo(80)
      .checkBetween([1, 100], 'quizzes_pass_threshold_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('quizzes');
}

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add description to lessons
  await knex.schema.alterTable('lessons', (table) => {
    table.text('description').nullable();
  });

  // Add lesson_id to quizzes (optional — quiz can belong to module OR lesson)
  await knex.schema.alterTable('quizzes', (table) => {
    table.uuid('lesson_id').nullable().references('id').inTable('lessons').onDelete('CASCADE');
    // Make module_id nullable so quiz can be lesson-level
    table.uuid('module_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('quizzes', (table) => {
    table.dropColumn('lesson_id');
    table.uuid('module_id').notNullable().alter();
  });
  await knex.schema.alterTable('lessons', (table) => {
    table.dropColumn('description');
  });
}

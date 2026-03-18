import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_lesson_progress', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    table.timestamp('completed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'lesson_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_lesson_progress');
}

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_quiz_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('quiz_id').notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    table.integer('score').notNullable();
    table.boolean('passed').notNullable();
    table.timestamp('attempted_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_quiz_attempts');
}

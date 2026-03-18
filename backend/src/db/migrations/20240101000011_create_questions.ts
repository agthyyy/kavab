import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('quiz_id').notNullable().references('id').inTable('quizzes').onDelete('CASCADE');
    table
      .string('question_type', 30)
      .notNullable()
      .checkIn(
        ['single', 'multiple', 'matching', 'true_false'],
        'questions_question_type_check',
      );
    table.text('text').notNullable();
    table.text('explanation').nullable();
    table.integer('order_index').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('questions');
}

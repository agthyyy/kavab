import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('answer_options', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('question_id')
      .notNullable()
      .references('id')
      .inTable('questions')
      .onDelete('CASCADE');
    table.text('text').notNullable();
    table.boolean('is_correct').notNullable().defaultTo(false);
    table.string('match_pair', 300).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('answer_options');
}

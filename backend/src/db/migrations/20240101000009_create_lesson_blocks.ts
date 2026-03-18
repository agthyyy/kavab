import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('lesson_blocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lesson_id').notNullable().references('id').inTable('lessons').onDelete('CASCADE');
    table
      .string('block_type', 20)
      .notNullable()
      .checkIn(['text', 'image', 'video'], 'lesson_blocks_block_type_check');
    table.text('content').nullable();
    table.integer('order_index').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lesson_blocks');
}

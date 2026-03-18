import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('xp_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('amount').notNullable();
    table
      .string('source_type', 20)
      .notNullable()
      .checkIn(['lesson', 'quiz'], 'xp_history_source_type_check');
    table.uuid('source_id').notNullable();
    table.timestamp('earned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('xp_history');
}

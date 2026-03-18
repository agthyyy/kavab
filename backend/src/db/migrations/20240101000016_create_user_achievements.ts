import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_achievements', (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table
      .uuid('achievement_id')
      .notNullable()
      .references('id')
      .inTable('achievements')
      .onDelete('CASCADE');
    table.timestamp('earned_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'achievement_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_achievements');
}

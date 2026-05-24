import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Добавляем поле для подсчета попыток в user_quiz_attempts
  await knex.schema.alterTable('user_quiz_attempts', (table) => {
    table.integer('attempt_number').notNullable().defaultTo(1);
  });

  // Создаем индекс для быстрого поиска по пользователю и квизу
  await knex.schema.raw(`
    CREATE INDEX idx_user_quiz_attempts_user_quiz 
    ON user_quiz_attempts(user_id, quiz_id, attempted_at DESC)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_quiz_attempts', (table) => {
    table.dropColumn('attempt_number');
  });
  
  await knex.schema.raw('DROP INDEX IF EXISTS idx_user_quiz_attempts_user_quiz');
}

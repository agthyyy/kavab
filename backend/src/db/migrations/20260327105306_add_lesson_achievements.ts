import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Добавляем поле lesson_id в таблицу achievements для связи с уроками
  await knex.schema.alterTable('achievements', (table) => {
    table.uuid('lesson_id').nullable().references('id').inTable('lessons').onDelete('CASCADE');
    table.index('lesson_id');
  });

  // Создаем таблицу для триггеров достижений
  await knex.schema.createTable('achievement_triggers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('achievement_id').notNullable().references('id').inTable('achievements').onDelete('CASCADE');
    table.string('trigger_type').notNullable(); // 'lesson_complete', 'quiz_pass', 'streak_days', etc.
    table.string('trigger_value').nullable(); // ID урока, количество дней и т.д.
    table.timestamps(true, true);
    
    table.index(['achievement_id']);
    table.index(['trigger_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('achievement_triggers');
  await knex.schema.alterTable('achievements', (table) => {
    table.dropColumn('lesson_id');
  });
}


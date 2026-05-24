import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // ── Daily Quests ──────────────────────────────────────────────────────────
  await knex.schema.createTable('daily_quests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.string('description').notNullable();
    table.string('quest_type').notNullable(); // 'complete_lessons', 'pass_quizzes', 'earn_xp', 'login_streak'
    table.integer('target_value').notNullable(); // количество для выполнения
    table.integer('xp_reward').notNullable();
    table.string('icon').notNullable();
    table.string('rarity').notNullable().defaultTo('common'); // common, rare, epic, legendary
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['quest_type']);
    table.index(['is_active']);
  });

  // ── User Daily Quest Progress ─────────────────────────────────────────────
  await knex.schema.createTable('user_daily_quests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('quest_id').notNullable().references('id').inTable('daily_quests').onDelete('CASCADE');
    table.integer('current_progress').notNullable().defaultTo(0);
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.timestamp('completed_at').nullable();
    table.date('quest_date').notNullable(); // дата для которой выдан квест
    table.timestamps(true, true);
    
    table.unique(['user_id', 'quest_id', 'quest_date']);
    table.index(['user_id', 'quest_date']);
    table.index(['is_completed']);
  });

  // ── Titles System ─────────────────────────────────────────────────────────
  await knex.schema.createTable('titles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('description').notNullable();
    table.string('icon').notNullable();
    table.string('rarity').notNullable(); // common, rare, epic, legendary, mythic
    table.string('unlock_condition').notNullable(); // 'achievements_count', 'specific_achievement', 'xp_total', 'streak_days'
    table.integer('unlock_value').notNullable();
    table.string('unlock_data').nullable(); // дополнительные данные (например, ID достижения)
    table.string('color_hex').notNullable().defaultTo('#6B7280'); // цвет титула
    table.boolean('is_secret').notNullable().defaultTo(false);
    table.timestamps(true, true);
    
    table.index(['rarity']);
    table.index(['unlock_condition']);
  });

  // ── User Titles ───────────────────────────────────────────────────────────
  await knex.schema.createTable('user_titles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('title_id').notNullable().references('id').inTable('titles').onDelete('CASCADE');
    table.timestamp('earned_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.unique(['user_id', 'title_id']);
    table.index(['user_id']);
  });

  // ── Collectible Cards ─────────────────────────────────────────────────────
  await knex.schema.createTable('collectible_cards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('description').notNullable();
    table.string('image_url').nullable();
    table.string('rarity').notNullable(); // common, rare, epic, legendary, mythic
    table.string('category').notNullable(); // 'coffee', 'barista', 'equipment', 'special'
    table.string('unlock_condition').notNullable(); // 'random_lesson', 'perfect_quiz', 'achievement', 'special_event'
    table.float('drop_chance').notNullable().defaultTo(0.1); // шанс выпадения (0.0 - 1.0)
    table.integer('collection_number').notNullable(); // номер в коллекции
    table.timestamps(true, true);
    
    table.unique(['collection_number']);
    table.index(['rarity']);
    table.index(['category']);
  });

  // ── User Card Collection ──────────────────────────────────────────────────
  await knex.schema.createTable('user_cards', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('card_id').notNullable().references('id').inTable('collectible_cards').onDelete('CASCADE');
    table.integer('quantity').notNullable().defaultTo(1); // количество одинаковых карт
    table.timestamp('first_obtained_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_obtained_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.unique(['user_id', 'card_id']);
    table.index(['user_id']);
  });

  // ── Energy System ─────────────────────────────────────────────────────────
  await knex.schema.alterTable('user_progress', (table) => {
    table.integer('energy').notNullable().defaultTo(100); // текущая энергия
    table.integer('max_energy').notNullable().defaultTo(100); // максимальная энергия
    table.timestamp('last_energy_update').notNullable().defaultTo(knex.fn.now());
    table.uuid('active_title_id').nullable().references('id').inTable('titles').onDelete('SET NULL'); // активный титул
  });

  // ── Combo System ──────────────────────────────────────────────────────────
  await knex.schema.createTable('user_combos', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('combo_type').notNullable(); // 'perfect_quiz', 'daily_login', 'lesson_streak'
    table.integer('current_streak').notNullable().defaultTo(0);
    table.integer('best_streak').notNullable().defaultTo(0);
    table.timestamp('last_action_at').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.unique(['user_id', 'combo_type']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_progress', (table) => {
    table.dropColumn('energy');
    table.dropColumn('max_energy');
    table.dropColumn('last_energy_update');
    table.dropColumn('active_title_id');
  });
  
  await knex.schema.dropTableIfExists('user_combos');
  await knex.schema.dropTableIfExists('user_cards');
  await knex.schema.dropTableIfExists('collectible_cards');
  await knex.schema.dropTableIfExists('user_titles');
  await knex.schema.dropTableIfExists('titles');
  await knex.schema.dropTableIfExists('user_daily_quests');
  await knex.schema.dropTableIfExists('daily_quests');
}


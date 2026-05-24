import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('user_combos').del();
  await knex('user_cards').del();
  await knex('collectible_cards').del();
  await knex('user_titles').del();
  await knex('titles').del();
  await knex('user_daily_quests').del();
  await knex('daily_quests').del();

  // ── Daily Quests ──────────────────────────────────────────────────────────
  await knex('daily_quests').insert([
    {
      title: 'Утренний кофе',
      description: 'Завершите 2 урока сегодня',
      quest_type: 'complete_lessons',
      target_value: 2,
      xp_reward: 100,
      icon: '☕',
      rarity: 'common',
    },
    {
      title: 'Знаток дня',
      description: 'Пройдите 1 тест на 100%',
      quest_type: 'perfect_quiz',
      target_value: 1,
      xp_reward: 150,
      icon: '🎯',
      rarity: 'rare',
    },
    {
      title: 'Энергичный старт',
      description: 'Наберите 200 XP сегодня',
      quest_type: 'earn_xp',
      target_value: 200,
      xp_reward: 80,
      icon: '⚡',
      rarity: 'common',
    },
    {
      title: 'Марафонец',
      description: 'Завершите 5 уроков за день',
      quest_type: 'complete_lessons',
      target_value: 5,
      xp_reward: 300,
      icon: '🏃',
      rarity: 'epic',
    },
    {
      title: 'Мастер тестов',
      description: 'Пройдите 3 теста подряд',
      quest_type: 'pass_quizzes',
      target_value: 3,
      xp_reward: 200,
      icon: '📝',
      rarity: 'rare',
    },
    {
      title: 'Постоянство',
      description: 'Войдите в систему 7 дней подряд',
      quest_type: 'login_streak',
      target_value: 7,
      xp_reward: 500,
      icon: '🔥',
      rarity: 'legendary',
    },
  ]);

  // ── Titles ────────────────────────────────────────────────────────────────
  await knex('titles').insert([
    // Beginner titles
    {
      name: 'Новичок',
      description: 'Добро пожаловать в мир кофе!',
      icon: '🌱',
      rarity: 'common',
      unlock_condition: 'xp_total',
      unlock_value: 0,
      color_hex: '#10B981',
    },
    {
      name: 'Ученик',
      description: 'Первые шаги в обучении',
      icon: '📚',
      rarity: 'common',
      unlock_condition: 'xp_total',
      unlock_value: 100,
      color_hex: '#3B82F6',
    },
    {
      name: 'Стажер',
      description: 'Базовые знания получены',
      icon: '👨‍🎓',
      rarity: 'common',
      unlock_condition: 'xp_total',
      unlock_value: 500,
      color_hex: '#8B5CF6',
    },

    // Achievement-based titles
    {
      name: 'Коллекционер',
      description: 'Получил 10 достижений',
      icon: '🏆',
      rarity: 'rare',
      unlock_condition: 'achievements_count',
      unlock_value: 10,
      color_hex: '#F59E0B',
    },
    {
      name: 'Охотник за достижениями',
      description: 'Получил 25 достижений',
      icon: '🎖️',
      rarity: 'epic',
      unlock_condition: 'achievements_count',
      unlock_value: 25,
      color_hex: '#EF4444',
    },

    // Streak-based titles
    {
      name: 'Постоянный клиент',
      description: 'Учился 7 дней подряд',
      icon: '🔥',
      rarity: 'rare',
      unlock_condition: 'streak_days',
      unlock_value: 7,
      color_hex: '#F97316',
    },
    {
      name: 'Фанат кофе',
      description: 'Учился 30 дней подряд',
      icon: '💪',
      rarity: 'epic',
      unlock_condition: 'streak_days',
      unlock_value: 30,
      color_hex: '#DC2626',
    },
    {
      name: 'Кофейный наркоман',
      description: 'Учился 100 дней подряд',
      icon: '🏃‍♂️',
      rarity: 'legendary',
      unlock_condition: 'streak_days',
      unlock_value: 100,
      color_hex: '#7C2D12',
    },

    // XP-based titles
    {
      name: 'Бариста-джуниор',
      description: 'Набрал 1000 XP',
      icon: '☕',
      rarity: 'rare',
      unlock_condition: 'xp_total',
      unlock_value: 1000,
      color_hex: '#92400E',
    },
    {
      name: 'Бариста',
      description: 'Набрал 5000 XP',
      icon: '👨‍🍳',
      rarity: 'epic',
      unlock_condition: 'xp_total',
      unlock_value: 5000,
      color_hex: '#059669',
    },
    {
      name: 'Мастер-бариста',
      description: 'Набрал 10000 XP',
      icon: '🌟',
      rarity: 'legendary',
      unlock_condition: 'xp_total',
      unlock_value: 10000,
      color_hex: '#7C3AED',
    },
    {
      name: 'Легенда кофейни',
      description: 'Набрал 25000 XP',
      icon: '👑',
      rarity: 'mythic',
      unlock_condition: 'xp_total',
      unlock_value: 25000,
      color_hex: '#D97706',
    },

    // Secret titles
    {
      name: 'Полуночник',
      description: 'Учился после полуночи',
      icon: '🌙',
      rarity: 'rare',
      unlock_condition: 'special_action',
      unlock_value: 1,
      unlock_data: 'midnight_learning',
      color_hex: '#4338CA',
      is_secret: true,
    },
    {
      name: 'Ранняя пташка',
      description: 'Учился до 6 утра',
      icon: '🌅',
      rarity: 'rare',
      unlock_condition: 'special_action',
      unlock_value: 1,
      unlock_data: 'early_learning',
      color_hex: '#F59E0B',
      is_secret: true,
    },
  ]);

  // ── Collectible Cards ─────────────────────────────────────────────────────
  await knex('collectible_cards').insert([
    // Coffee cards
    {
      name: 'Эспрессо',
      description: 'Основа всех кофейных напитков',
      category: 'coffee',
      rarity: 'common',
      unlock_condition: 'random_lesson',
      drop_chance: 0.3,
      collection_number: 1,
    },
    {
      name: 'Капучино',
      description: 'Идеальное сочетание кофе и молока',
      category: 'coffee',
      rarity: 'common',
      unlock_condition: 'random_lesson',
      drop_chance: 0.25,
      collection_number: 2,
    },
    {
      name: 'Латте',
      description: 'Нежный кофе с молочной пенкой',
      category: 'coffee',
      rarity: 'common',
      unlock_condition: 'random_lesson',
      drop_chance: 0.25,
      collection_number: 3,
    },
    {
      name: 'Американо',
      description: 'Эспрессо с горячей водой',
      category: 'coffee',
      rarity: 'common',
      unlock_condition: 'random_lesson',
      drop_chance: 0.2,
      collection_number: 4,
    },
    {
      name: 'Мокко',
      description: 'Кофе с шоколадом',
      category: 'coffee',
      rarity: 'rare',
      unlock_condition: 'perfect_quiz',
      drop_chance: 0.1,
      collection_number: 5,
    },

    // Barista cards
    {
      name: 'Мастер латте-арт',
      description: 'Виртуоз рисования на кофе',
      category: 'barista',
      rarity: 'epic',
      unlock_condition: 'achievement',
      drop_chance: 0.05,
      collection_number: 6,
    },
    {
      name: 'Чемпион по эспрессо',
      description: 'Лучший в приготовлении эспрессо',
      category: 'barista',
      rarity: 'legendary',
      unlock_condition: 'special_event',
      drop_chance: 0.02,
      collection_number: 7,
    },

    // Equipment cards
    {
      name: 'Кофемашина La Marzocco',
      description: 'Профессиональная кофемашина',
      category: 'equipment',
      rarity: 'epic',
      unlock_condition: 'achievement',
      drop_chance: 0.03,
      collection_number: 8,
    },
    {
      name: 'Кофемолка Mahlkönig',
      description: 'Точный помол для идеального кофе',
      category: 'equipment',
      rarity: 'rare',
      unlock_condition: 'perfect_quiz',
      drop_chance: 0.08,
      collection_number: 9,
    },

    // Special cards
    {
      name: 'Золотое зерно',
      description: 'Легендарное кофейное зерно',
      category: 'special',
      rarity: 'mythic',
      unlock_condition: 'special_event',
      drop_chance: 0.001,
      collection_number: 10,
    },
  ]);

  console.log('✅ Gamification features seeded successfully');
}
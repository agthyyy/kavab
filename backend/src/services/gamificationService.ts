import db from '../config/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  questType: string;
  targetValue: number;
  xpReward: number;
  icon: string;
  rarity: string;
  currentProgress: number;
  isCompleted: boolean;
}

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  colorHex: string;
  isUnlocked: boolean;
  isActive: boolean;
}

export interface CollectibleCard {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: string;
  category: string;
  collectionNumber: number;
  quantity: number;
  firstObtainedAt?: Date;
}

export interface UserEnergy {
  current: number;
  max: number;
  lastUpdate: Date;
  regenRate: number; // энергии в час
}

export interface ComboStreak {
  type: string;
  current: number;
  best: number;
  lastAction: Date;
}

// ── Daily Quests ──────────────────────────────────────────────────────────────

export async function generateDailyQuests(userId: string): Promise<DailyQuest[]> {
  const today = new Date().toISOString().slice(0, 10);
  
  // Проверяем есть ли уже квесты на сегодня
  const existingQuests = await db('user_daily_quests')
    .join('daily_quests', 'user_daily_quests.quest_id', 'daily_quests.id')
    .where('user_daily_quests.user_id', userId)
    .where('user_daily_quests.quest_date', today)
    .select(
      'daily_quests.*',
      'user_daily_quests.current_progress',
      'user_daily_quests.is_completed'
    );

  if (existingQuests.length > 0) {
    return existingQuests.map(formatDailyQuest);
  }

  // Генерируем новые квесты на день (3 случайных)
  const availableQuests = await db('daily_quests')
    .where('is_active', true)
    .orderByRaw('RANDOM()')
    .limit(3);

  const userQuests = [];
  for (const quest of availableQuests) {
    await db('user_daily_quests').insert({
      user_id: userId,
      quest_id: quest.id,
      quest_date: today,
      current_progress: 0,
      is_completed: false,
    });

    userQuests.push({
      ...quest,
      current_progress: 0,
      is_completed: false,
    });
  }

  return userQuests.map(formatDailyQuest);
}

export async function updateQuestProgress(
  userId: string,
  questType: string,
  increment: number = 1
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const userQuests = await db('user_daily_quests')
    .join('daily_quests', 'user_daily_quests.quest_id', 'daily_quests.id')
    .where('user_daily_quests.user_id', userId)
    .where('user_daily_quests.quest_date', today)
    .where('daily_quests.quest_type', questType)
    .where('user_daily_quests.is_completed', false)
    .select('user_daily_quests.id', 'daily_quests.target_value', 'user_daily_quests.current_progress');

  for (const userQuest of userQuests) {
    const newProgress = userQuest.current_progress + increment;
    const isCompleted = newProgress >= userQuest.target_value;

    await db('user_daily_quests')
      .where('id', userQuest.id)
      .update({
        current_progress: Math.min(newProgress, userQuest.target_value),
        is_completed: isCompleted,
        completed_at: isCompleted ? db.fn.now() : null,
      });

    // Если квест завершен, награждаем XP
    if (isCompleted && userQuest.current_progress < userQuest.target_value) {
      const quest = await db('daily_quests').where('id', userQuest.quest_id).first();
      if (quest) {
        await db('xp_history').insert({
          user_id: userId,
          xp_change: quest.xp_reward,
          reason: `Ежедневное задание: ${quest.title}`,
        });

        await db('user_progress')
          .where('user_id', userId)
          .increment('total_xp', quest.xp_reward);
      }
    }
  }
}

// ── Titles System ─────────────────────────────────────────────────────────────

export async function checkAndUnlockTitles(userId: string): Promise<Title[]> {
  // Получаем статистику пользователя
  const userProgress = await db('user_progress').where('user_id', userId).first();
  if (!userProgress) return [];

  const achievementsCount = await db('user_achievements')
    .where('user_id', userId)
    .count('achievement_id as count')
    .first();

  const stats = {
    totalXp: userProgress.total_xp || 0,
    streakDays: userProgress.streak || 0,
    achievementsCount: parseInt(achievementsCount?.count as string || '0'),
  };

  // Получаем все титулы
  const allTitles = await db('titles').select('*');
  const unlockedTitleIds = await db('user_titles')
    .where('user_id', userId)
    .pluck('title_id');

  const newlyUnlocked: Title[] = [];

  for (const title of allTitles) {
    if (unlockedTitleIds.includes(title.id)) continue;

    let shouldUnlock = false;

    switch (title.unlock_condition) {
      case 'xp_total':
        shouldUnlock = stats.totalXp >= title.unlock_value;
        break;
      case 'achievements_count':
        shouldUnlock = stats.achievementsCount >= title.unlock_value;
        break;
      case 'streak_days':
        shouldUnlock = stats.streakDays >= title.unlock_value;
        break;
    }

    if (shouldUnlock) {
      await db('user_titles').insert({
        user_id: userId,
        title_id: title.id,
      });
      newlyUnlocked.push(formatTitle(title, true, false));
    }
  }

  return newlyUnlocked;
}

export async function getUserTitles(userId: string): Promise<Title[]> {
  const userProgress = await db('user_progress').where('user_id', userId).first();
  const activeTitleId = userProgress?.active_title_id;

  const titles = await db('titles')
    .leftJoin('user_titles', function() {
      this.on('titles.id', '=', 'user_titles.title_id')
        .andOn('user_titles.user_id', '=', db.raw('?', [userId]));
    })
    .select(
      'titles.*',
      'user_titles.earned_at'
    )
    .orderBy('titles.rarity', 'asc');

  return titles.map(title => formatTitle(
    title,
    !!title.earned_at,
    title.id === activeTitleId
  ));
}

export async function setActiveTitle(userId: string, titleId: string): Promise<void> {
  // Проверяем что пользователь имеет этот титул
  const userTitle = await db('user_titles')
    .where('user_id', userId)
    .where('title_id', titleId)
    .first();

  if (!userTitle) {
    throw new Error('Title not owned by user');
  }

  await db('user_progress')
    .where('user_id', userId)
    .update('active_title_id', titleId);
}

// ── Energy System ─────────────────────────────────────────────────────────────

export async function getUserEnergy(userId: string): Promise<UserEnergy> {
  let userProgress = await db('user_progress').where('user_id', userId).first();
  
  // Создаем запись user_progress если её нет
  if (!userProgress) {
    await db('user_progress').insert({
      user_id: userId,
      total_xp: 0,
      streak: 0,
      energy: 100,
      max_energy: 100,
      last_energy_update: db.fn.now(),
    });
    userProgress = await db('user_progress').where('user_id', userId).first();
  }

  const now = new Date();
  const lastUpdate = new Date(userProgress.last_energy_update);
  const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  // Восстанавливаем энергию (10 энергии в час)
  const regenRate = 10;
  const energyToRestore = Math.floor(hoursPassed * regenRate);
  const currentEnergy = Math.min(
    userProgress.max_energy,
    userProgress.energy + energyToRestore
  );

  // Обновляем в базе если прошло время
  if (energyToRestore > 0) {
    await db('user_progress')
      .where('user_id', userId)
      .update({
        energy: currentEnergy,
        last_energy_update: now,
      });
  }

  return {
    current: currentEnergy,
    max: userProgress.max_energy,
    lastUpdate: now,
    regenRate,
  };
}

export async function consumeEnergy(userId: string, amount: number): Promise<boolean> {
  const energy = await getUserEnergy(userId);
  
  if (energy.current < amount) {
    return false; // Недостаточно энергии
  }

  await db('user_progress')
    .where('user_id', userId)
    .decrement('energy', amount);

  return true;
}

// ── Collectible Cards ─────────────────────────────────────────────────────────

export async function tryDropCard(
  userId: string,
  condition: string,
  context?: any
): Promise<CollectibleCard | null> {
  const availableCards = await db('collectible_cards')
    .where('unlock_condition', condition)
    .select('*');

  for (const card of availableCards) {
    if (Math.random() <= card.drop_chance) {
      // Проверяем есть ли уже эта карта у пользователя
      const existingCard = await db('user_cards')
        .where('user_id', userId)
        .where('card_id', card.id)
        .first();

      if (existingCard) {
        // Увеличиваем количество
        await db('user_cards')
          .where('id', existingCard.id)
          .increment('quantity', 1)
          .update('last_obtained_at', db.fn.now());
      } else {
        // Добавляем новую карту
        await db('user_cards').insert({
          user_id: userId,
          card_id: card.id,
          quantity: 1,
        });
      }

      return formatCollectibleCard(card, existingCard?.quantity + 1 || 1);
    }
  }

  return null;
}

export async function getUserCards(userId: string): Promise<CollectibleCard[]> {
  const userCards = await db('user_cards')
    .join('collectible_cards', 'user_cards.card_id', 'collectible_cards.id')
    .where('user_cards.user_id', userId)
    .select(
      'collectible_cards.*',
      'user_cards.quantity',
      'user_cards.first_obtained_at'
    )
    .orderBy('collectible_cards.collection_number');

  return userCards.map(card => formatCollectibleCard(card, card.quantity, card.first_obtained_at));
}

// ── Combo System ──────────────────────────────────────────────────────────────

export async function updateComboStreak(
  userId: string,
  comboType: string,
  success: boolean = true
): Promise<ComboStreak> {
  const existing = await db('user_combos')
    .where('user_id', userId)
    .where('combo_type', comboType)
    .first();

  const now = new Date();
  let currentStreak = 0;
  let bestStreak = 0;

  if (existing) {
    if (success) {
      currentStreak = existing.current_streak + 1;
      bestStreak = Math.max(existing.best_streak, currentStreak);
    } else {
      currentStreak = 0;
      bestStreak = existing.best_streak;
    }

    await db('user_combos')
      .where('id', existing.id)
      .update({
        current_streak: currentStreak,
        best_streak: bestStreak,
        last_action_at: now,
      });
  } else {
    currentStreak = success ? 1 : 0;
    bestStreak = currentStreak;

    await db('user_combos').insert({
      user_id: userId,
      combo_type: comboType,
      current_streak: currentStreak,
      best_streak: bestStreak,
      last_action_at: now,
    });
  }

  return {
    type: comboType,
    current: currentStreak,
    best: bestStreak,
    lastAction: now,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

function formatDailyQuest(quest: any): DailyQuest {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    questType: quest.quest_type,
    targetValue: quest.target_value,
    xpReward: quest.xp_reward,
    icon: quest.icon,
    rarity: quest.rarity,
    currentProgress: quest.current_progress || 0,
    isCompleted: quest.is_completed || false,
  };
}

function formatTitle(title: any, isUnlocked: boolean, isActive: boolean): Title {
  return {
    id: title.id,
    name: title.name,
    description: title.description,
    icon: title.icon,
    rarity: title.rarity,
    colorHex: title.color_hex,
    isUnlocked,
    isActive,
  };
}

function formatCollectibleCard(card: any, quantity: number, firstObtainedAt?: Date): CollectibleCard {
  return {
    id: card.id,
    name: card.name,
    description: card.description,
    imageUrl: card.image_url,
    rarity: card.rarity,
    category: card.category,
    collectionNumber: card.collection_number,
    quantity,
    firstObtainedAt,
  };
}
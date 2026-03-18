# Технический дизайн: Kavabanga Learning Platform

## Обзор

Kavabanga Learning Platform — мобильное обучающее приложение для сотрудников сети кофеен. Платформа реализует геймифицированное линейное обучение (аналог Duolingo): сотрудник проходит уроки, сдаёт тесты и открывает следующие модули. Контент управляется через отдельную веб-панель администратора.

### Ключевые характеристики системы

- Мобильное приложение: Flutter (iOS/Android), Clean Architecture + BLoC/Cubit
- Бэкенд: Node.js + Express (REST API)
- База данных: PostgreSQL
- Хранилище медиа: Firebase Storage
- Админ-панель: Next.js (React)
- Push-уведомления: Firebase Cloud Messaging (FCM)
- Аутентификация: JWT (access + refresh токены)

### Обоснование выбора технологий

**Node.js + Express + PostgreSQL** выбраны вместо Firebase по следующим причинам:
- Реляционная структура данных (курсы → модули → уроки → тесты) хорошо ложится на PostgreSQL
- Полный контроль над бизнес-логикой начисления XP, стриков и ачивок
- Возможность сложных аналитических запросов для отчётов администратора
- Firebase Storage используется только для медиафайлов (видео, изображения) — это оптимально по стоимости и CDN-производительности

---

## Архитектура

### Общая схема системы

```
┌─────────────────────────────────────────────────────────────────┐
│                        КЛИЕНТЫ                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │  Flutter Mobile App  │    │   Next.js Admin Panel (Web)  │   │
│  │  (iOS / Android)     │    │                              │   │
│  └──────────┬───────────┘    └──────────────┬───────────────┘   │
└─────────────┼────────────────────────────────┼───────────────────┘
              │ HTTPS/REST                      │ HTTPS/REST
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js + Express API                        │
│  ┌────────────┐ ┌───────────────┐ ┌──────────────┐ ┌────────┐  │
│  │Auth Router │ │Content Router │ │Progress Router│ │Admin   │  │
│  │            │ │               │ │               │ │Router  │  │
│  └─────┬──────┘ └───────┬───────┘ └──────┬────────┘ └───┬────┘  │
│        └────────────────┴────────────────┴──────────────┘       │
│                              │                                   │
│                    ┌─────────▼──────────┐                        │
│                    │  Service Layer     │                        │
│                    │  (Business Logic)  │                        │
│                    └─────────┬──────────┘                        │
│                              │                                   │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│        ┌──────────┐  ┌──────────────┐  ┌──────────┐             │
│        │PostgreSQL│  │Firebase      │  │FCM Push  │             │
│        │          │  │Storage       │  │Service   │             │
│        └──────────┘  └──────────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Архитектура Flutter-приложения (Clean Architecture)

```
lib/
├── core/
│   ├── error/          # Failures, Exceptions
│   ├── network/        # Dio client, interceptors
│   ├── storage/        # SecureStorage, SharedPreferences
│   └── utils/          # Constants, extensions
├── features/
│   ├── auth/
│   │   ├── data/       # AuthRemoteDataSource, AuthRepository impl
│   │   ├── domain/     # AuthRepository interface, UseCases, Entities
│   │   └── presentation/ # AuthBloc/Cubit, screens, widgets
│   ├── learning_tree/
│   ├── lesson/
│   ├── quiz/
│   ├── gamification/
│   ├── profile/
│   └── notifications/
└── injection_container.dart
```

### Архитектура бэкенда

```
src/
├── routes/             # Express routers
├── controllers/        # Request handlers
├── services/           # Business logic
├── repositories/       # DB access layer
├── models/             # Sequelize/Knex models
├── middleware/         # Auth, validation, error handling
├── jobs/               # Cron jobs (streak reset, reminder notifications)
└── config/             # DB, Firebase, FCM config
```

---

## Компоненты и интерфейсы

### REST API — основные эндпоинты

#### Auth Service (`/api/auth`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/login` | Аутентификация по логину/паролю |
| POST | `/refresh` | Обновление access-токена |
| POST | `/logout` | Завершение сессии |

#### Content Service (`/api/content`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/courses` | Список назначенных курсов |
| GET | `/courses/:id/tree` | Дерево модулей курса с прогрессом |
| GET | `/lessons/:id` | Контент урока |
| GET | `/quizzes/:id` | Вопросы теста |
| POST | `/media/upload-url` | Получить presigned URL для загрузки в Firebase Storage |

#### Progress Service (`/api/progress`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/lessons/:id/complete` | Завершить урок, начислить XP |
| POST | `/quizzes/:id/submit` | Отправить ответы теста |
| GET | `/me` | Текущий прогресс, XP, уровень, стрик |
| GET | `/me/achievements` | Список ачивок сотрудника |
| GET | `/me/xp-history` | История начисления XP |

#### Admin Service (`/api/admin`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/users` | Создать учётную запись сотрудника |
| PATCH | `/users/:id` | Обновить / деактивировать сотрудника |
| GET | `/users` | Список сотрудников |
| POST | `/courses` | Создать курс |
| PUT | `/courses/:id` | Редактировать курс |
| POST | `/courses/:id/publish` | Опубликовать курс |
| POST | `/modules` | Создать модуль |
| POST | `/lessons` | Создать урок |
| POST | `/quizzes` | Создать тест |
| POST | `/achievements` | Создать ачивку |
| POST | `/users/:id/courses` | Назначить курс сотруднику |

### Flutter BLoC/Cubit компоненты

| Cubit/Bloc | Состояния | Ответственность |
|------------|-----------|-----------------|
| `AuthCubit` | Initial, Loading, Authenticated, Unauthenticated, Error | Логин, логаут, refresh токена |
| `LearningTreeBloc` | Loading, Loaded, Error | Загрузка дерева модулей |
| `LessonCubit` | Loading, Loaded, Completing, Completed, Error | Контент урока, завершение |
| `QuizBloc` | Loading, InProgress, Submitting, Result, Error | Прохождение теста |
| `GamificationCubit` | — | XP, уровень, стрик, ачивки |
| `ProfileCubit` | Loading, Loaded | Профиль сотрудника |
| `NotificationCubit` | — | FCM токен, разрешения |

---

## Модели данных

### PostgreSQL схема

```sql
-- Пользователи
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login       VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    role        VARCHAR(50) NOT NULL CHECK (role IN ('barista','waiter','manager','admin')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Уровни (конфигурация)
CREATE TABLE levels (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,   -- "Новичок", "Мастер эспрессо"
    xp_required INT NOT NULL,
    order_index INT NOT NULL
);

-- Прогресс пользователя
CREATE TABLE user_progress (
    user_id     UUID PRIMARY KEY REFERENCES users(id),
    total_xp    INT NOT NULL DEFAULT 0,
    level_id    INT REFERENCES levels(id),
    streak      INT NOT NULL DEFAULT 0,
    last_activity_date DATE
);

-- История XP
CREATE TABLE xp_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    amount      INT NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('lesson','quiz')),
    source_id   UUID NOT NULL,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Курсы
CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(300) NOT NULL,
    description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Назначение курсов сотрудникам
CREATE TABLE user_courses (
    user_id     UUID REFERENCES users(id),
    course_id   UUID REFERENCES courses(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, course_id)
);

-- Модули
CREATE TABLE modules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id),
    title       VARCHAR(300) NOT NULL,
    order_index INT NOT NULL,
    pass_threshold INT NOT NULL DEFAULT 80 CHECK (pass_threshold BETWEEN 1 AND 100)
);

-- Уроки
CREATE TABLE lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id   UUID NOT NULL REFERENCES modules(id),
    title       VARCHAR(300) NOT NULL,
    order_index INT NOT NULL,
    xp_reward   INT NOT NULL DEFAULT 10
);

-- Блоки контента урока
CREATE TABLE lesson_blocks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   UUID NOT NULL REFERENCES lessons(id),
    block_type  VARCHAR(20) NOT NULL CHECK (block_type IN ('text','image','video')),
    content     TEXT,           -- текст или URL медиафайла
    order_index INT NOT NULL
);

-- Тесты
CREATE TABLE quizzes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id   UUID NOT NULL REFERENCES modules(id) UNIQUE,
    xp_max      INT NOT NULL DEFAULT 50,
    pass_threshold INT NOT NULL DEFAULT 80 CHECK (pass_threshold BETWEEN 1 AND 100)
);

-- Вопросы теста
CREATE TABLE questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id     UUID NOT NULL REFERENCES quizzes(id),
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('single','multiple','matching','true_false')),
    text        TEXT NOT NULL,
    explanation TEXT,
    order_index INT NOT NULL
);

-- Варианты ответов
CREATE TABLE answer_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    match_pair  VARCHAR(300)   -- для типа "Сопоставление"
);

-- Прогресс по урокам
CREATE TABLE user_lesson_progress (
    user_id     UUID REFERENCES users(id),
    lesson_id   UUID REFERENCES lessons(id),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

-- Прогресс по тестам
CREATE TABLE user_quiz_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    quiz_id     UUID NOT NULL REFERENCES quizzes(id),
    score       INT NOT NULL,           -- процент правильных ответов
    passed      BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ачивки
CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    condition_type VARCHAR(50) NOT NULL,  -- 'quiz_perfect', 'streak_days', 'lessons_count', etc.
    condition_value INT NOT NULL
);

-- Ачивки пользователей
CREATE TABLE user_achievements (
    user_id     UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- FCM токены
CREATE TABLE fcm_tokens (
    user_id     UUID REFERENCES users(id),
    token       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id)
);
```

### Ключевые Flutter-сущности (Domain Layer)

```dart
// Пользователь / сессия
class UserEntity {
  final String id;
  final String fullName;
  final String role;
  final String accessToken;
}

// Узел дерева обучения
class ModuleNode {
  final String id;
  final String title;
  final ModuleStatus status; // locked | available | completed
  final int orderIndex;
}

enum ModuleStatus { locked, available, completed }

// Урок
class LessonEntity {
  final String id;
  final String title;
  final List<LessonBlock> blocks;
  final int xpReward;
  final bool isCompleted;
}

// Блок контента
sealed class LessonBlock {}
class TextBlock extends LessonBlock { final String content; }
class ImageBlock extends LessonBlock { final String url; }
class VideoBlock extends LessonBlock { final String url; }

// Вопрос теста
class QuestionEntity {
  final String id;
  final QuestionType type;
  final String text;
  final List<AnswerOption> options;
}

// Прогресс / геймификация
class UserProgressEntity {
  final int totalXp;
  final String levelName;
  final int xpToNextLevel;
  final int streak;
  final List<AchievementEntity> achievements;
}
```

---

## Correctness Properties

*Свойство (property) — характеристика или поведение, которое должно выполняться при всех допустимых выполнениях системы. Это формальное утверждение о том, что система должна делать. Свойства служат мостом между читаемыми человеком спецификациями и машинно-верифицируемыми гарантиями корректности.*


### Свойство 1: Успешная аутентификация возвращает токен

*Для любого* зарегистрированного активного пользователя, при вводе корректного логина и пароля, Auth_Service должен вернуть валидный JWT access-токен и refresh-токен.

**Validates: Requirements 1.1, 2.1**

---

### Свойство 2: Некорректные учётные данные отклоняются

*Для любой* пары (логин, пароль), где пароль не совпадает с хранимым хешем или логин не существует, Auth_Service должен вернуть ошибку аутентификации и не выдавать токен.

**Validates: Requirements 1.2**

---

### Свойство 3: Logout инвалидирует сессию

*Для любого* аутентифицированного пользователя, после вызова logout, использование его предыдущего access-токена должно возвращать ошибку авторизации (401).

**Validates: Requirements 1.5**

---

### Свойство 4: Уникальность логина при создании пользователя

*Для любого* существующего логина в системе, попытка создать нового пользователя с тем же логином должна возвращать ошибку и не создавать дублирующую запись.

**Validates: Requirements 2.2**

---

### Свойство 5: Деактивация немедленно блокирует доступ

*Для любого* активного пользователя, после деактивации его учётной записи администратором, попытка входа с его учётными данными должна возвращать ошибку доступа.

**Validates: Requirements 2.3**

---

### Свойство 6: Роль пользователя всегда из допустимого множества

*Для любого* запроса на создание или обновление пользователя, значение поля `role` должно быть одним из: `barista`, `waiter`, `manager`, `admin`. Любое другое значение должно отклоняться с ошибкой валидации.

**Validates: Requirements 2.4**

---

### Свойство 7: Каждый модуль в дереве имеет валидный статус

*Для любого* пользователя и любого назначенного ему курса, каждый модуль в дереве обучения должен иметь ровно один из трёх статусов: `locked`, `available`, `completed`. Не должно существовать модулей без статуса или с неизвестным статусом.

**Validates: Requirements 3.1**

---

### Свойство 8: Заблокированный модуль недоступен для чтения

*Для любого* пользователя и любого модуля со статусом `locked`, запрос контента этого модуля должен возвращать ошибку доступа (403), а не содержимое модуля.

**Validates: Requirements 3.2**

---

### Свойство 9: Успешная сдача теста разблокирует следующий модуль

*Для любого* модуля с тестом и следующим заблокированным модулем, после успешной сдачи теста (результат >= порог) следующий модуль должен перейти в статус `available`.

**Validates: Requirements 3.3, 5.5**

---

### Свойство 10: Первый открытый урок — первый непройденный

*Для любого* доступного модуля с несколькими уроками, при открытии модуля система должна указывать на урок с наименьшим `order_index` среди непройденных уроков данного пользователя.

**Validates: Requirements 3.5**

---

### Свойство 11: Round-trip контента урока

*Для любого* урока, созданного администратором с набором блоков (текст, изображение, видео), запрос этого урока через Content_Service должен вернуть все те же блоки в том же порядке.

**Validates: Requirements 4.1, 10.2**

---

### Свойство 12: Завершение урока начисляет XP и помечает урок пройденным

*Для любого* непройденного урока с заданным `xp_reward`, после вызова complete, суммарные XP пользователя должны увеличиться ровно на `xp_reward`, а урок должен появиться в списке пройденных.

**Validates: Requirements 4.4, 6.1**

---

### Свойство 13: Результат теста вычисляется как процент правильных ответов

*Для любого* набора ответов на тест, вычисленный результат должен равняться `floor(правильные_ответы / всего_вопросов * 100)`. Результат должен быть в диапазоне [0, 100].

**Validates: Requirements 5.2**

---

### Свойство 14: Разбор ошибок содержит правильные ответы для неверных

*Для любого* завершённого теста, в разборе ошибок для каждого вопроса, на который дан неправильный ответ, должен присутствовать правильный вариант ответа и пояснение (если задано).

**Validates: Requirements 5.3**

---

### Свойство 15: Тест не засчитывается при результате ниже порога

*Для любого* теста с пороговым значением `T` и любого результата `score < T`, тест не должен быть помечен как пройденный (`passed = false`), и следующий модуль не должен разблокироваться.

**Validates: Requirements 5.4**

---

### Свойство 16: Типы вопросов ограничены допустимым множеством

*Для любого* запроса на создание вопроса, значение `question_type` должно быть одним из: `single`, `multiple`, `matching`, `true_false`. Любое другое значение должно отклоняться с ошибкой валидации.

**Validates: Requirements 5.1, 10.3**

---

### Свойство 17: XP за тест пропорционален результату

*Для любого* успешно сданного теста с `xp_max` и результатом `score%`, начисленные XP должны равняться `round(score / 100 * xp_max)`.

**Validates: Requirements 6.2**

---

### Свойство 18: Повышение уровня при достижении порога XP

*Для любого* пользователя, когда его суммарные XP достигают или превышают пороговое значение следующего уровня, уровень пользователя должен быть обновлён до следующего.

**Validates: Requirements 6.3**

---

### Свойство 19: История XP содержит запись после каждого начисления

*Для любого* начисления XP (за урок или тест), в таблице `xp_history` должна появиться запись с корректным `source_type`, `source_id`, `amount` и `user_id`.

**Validates: Requirements 6.5**

---

### Свойство 20: Ачивка присваивается при выполнении условия и не дублируется

*Для любой* ачивки и любого пользователя, при выполнении условия ачивки она должна появиться в профиле пользователя ровно один раз — повторное выполнение условия не должно создавать дубликат.

**Validates: Requirements 7.1, 7.2, 7.4, 8.4**

---

### Свойство 21: Стрик увеличивается на 1 при активности в день

*Для любого* пользователя, завершившего хотя бы один урок или тест в текущий календарный день, значение стрика должно быть на 1 больше, чем было в предыдущий день активности.

**Validates: Requirements 8.1**

---

### Свойство 22: Стрик сбрасывается при пропуске дня

*Для любого* пользователя, не завершившего ни одного урока или теста в течение полного календарного дня, значение стрика на следующий день должно быть равно 0.

**Validates: Requirements 8.2**

---

### Свойство 23: Процент завершения курса вычисляется корректно

*Для любого* пользователя и любого назначенного ему курса, отображаемый процент завершения должен равняться `floor(пройденные_уроки / всего_уроков_в_курсе * 100)`.

**Validates: Requirements 9.3**

---

### Свойство 24: Пороговый процент теста в диапазоне [1, 100]

*Для любого* запроса на создание или обновление теста или модуля, значение `pass_threshold` вне диапазона [1, 100] должно отклоняться с ошибкой валидации.

**Validates: Requirements 10.4**

---

### Свойство 25: Курс недоступен для назначения до публикации

*Для любого* неопубликованного курса, попытка назначить его сотруднику должна возвращать ошибку. После публикации курс должен быть доступен для назначения.

**Validates: Requirements 10.6**

---

### Свойство 26: Редактирование урока не затрагивает прошедших сотрудников

*Для любого* сотрудника, уже завершившего урок, редактирование содержимого этого урока администратором не должно изменять статус прохождения урока данным сотрудником.

**Validates: Requirements 10.7**

---

### Свойство 27: Уведомления не отправляются пользователям без FCM-токена

*Для любого* события, генерирующего push-уведомление, пользователи без зарегистрированного FCM-токена не должны попадать в список получателей.

**Validates: Requirements 11.3**

---

### Свойство 28: Cron-job напоминаний выбирает корректных получателей

*Для любого* запуска cron-job напоминаний, в список получателей должны попадать только пользователи, не открывавшие приложение более 24 часов и имеющие активный FCM-токен.

**Validates: Requirements 11.2**

---


## Обработка ошибок

### Стратегия обработки ошибок на бэкенде

Все ошибки возвращаются в едином формате:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Неверный логин или пароль",
    "details": {}
  }
}
```

| HTTP-код | Код ошибки | Описание |
|----------|-----------|----------|
| 400 | `VALIDATION_ERROR` | Невалидные входные данные |
| 401 | `INVALID_CREDENTIALS` | Неверный логин/пароль |
| 401 | `TOKEN_EXPIRED` | Access-токен истёк |
| 401 | `TOKEN_INVALID` | Невалидный токен |
| 403 | `ACCOUNT_DISABLED` | Учётная запись деактивирована |
| 403 | `MODULE_LOCKED` | Попытка доступа к заблокированному модулю |
| 403 | `COURSE_NOT_PUBLISHED` | Курс не опубликован |
| 409 | `LOGIN_ALREADY_EXISTS` | Логин уже занят |
| 423 | `ACCOUNT_LOCKED` | Аккаунт заблокирован после 5 неудачных попыток |
| 503 | `MEDIA_UPLOAD_FAILED` | Ошибка загрузки медиафайла в Firebase Storage |

### Блокировка после неудачных попыток входа

Реализуется через Redis (или in-memory с TTL):
- Ключ: `login_attempts:{login}`
- Значение: счётчик попыток
- TTL: 15 минут после 5-й неудачной попытки

### Обработка ошибок в Flutter

```
NetworkException → Failure → BLoC Error State → UI Error Widget
```

Используется `Either<Failure, T>` из пакета `dartz` или `fpdart`:

```dart
abstract class Failure {
  final String message;
}

class NetworkFailure extends Failure {}
class AuthFailure extends Failure {}
class ServerFailure extends Failure {}
class CacheFailure extends Failure {}
```

Offline-режим: при отсутствии сети Content_Service возвращает `NetworkFailure`, UI отображает сообщение с кнопкой "Повторить".

---

## Стратегия тестирования

### Подход: двойное тестирование

Используются два взаимодополняющих типа тестов:
- **Unit/Integration тесты** — конкретные примеры, граничные случаи, интеграция компонентов
- **Property-based тесты** — универсальные свойства для всех допустимых входных данных

### Бэкенд (Node.js)

**Инструменты:**
- Unit/Integration: `Jest` + `Supertest`
- Property-based: `fast-check`
- БД для тестов: PostgreSQL в Docker (или `pg-mem` для unit-тестов)

**Конфигурация property-based тестов:**
- Минимум 100 итераций на каждый тест (`fc.configureGlobal({ numRuns: 100 })`)
- Каждый тест помечается комментарием: `// Feature: kavabanga-learning-platform, Property N: <текст свойства>`

**Пример property-теста:**

```typescript
// Feature: kavabanga-learning-platform, Property 13: Результат теста = процент правильных ответов
it('quiz score equals correct answers percentage', () => {
  fc.assert(
    fc.property(
      fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
      (answers) => {
        const correct = answers.filter(Boolean).length;
        const score = calculateScore(answers);
        return score === Math.floor((correct / answers.length) * 100);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Unit-тесты фокусируются на:**
- Конкретные примеры: блокировка после 5 попыток (Требование 1.3)
- Граничные случаи: пороговые значения XP для повышения уровня
- Интеграция: назначение курса → отправка FCM-уведомления

### Flutter (Dart)

**Инструменты:**
- Unit/Widget: `flutter_test` (встроен в Flutter SDK)
- BLoC-тесты: `bloc_test`
- Property-based: `glados` (property-based testing для Dart)

**Конфигурация:**
- Минимум 100 итераций: `Glados(settings: Settings(runs: 100))`
- Каждый тест помечается: `// Feature: kavabanga-learning-platform, Property N: <текст>`

**Пример property-теста на Dart:**

```dart
// Feature: kavabanga-learning-platform, Property 7: Каждый модуль имеет валидный статус
glados.test('every module has valid status', (List<ModuleNode> modules) {
  for (final module in modules) {
    expect(
      ModuleStatus.values.contains(module.status),
      isTrue,
    );
  }
});
```

**Widget-тесты фокусируются на:**
- Отображение дерева обучения с тремя состояниями модулей
- Корректный рендер блоков контента урока (текст, изображение, видео)
- Счётчик вопросов в тесте

### Покрытие тестами по требованиям

| Требование | Тип теста | Свойство |
|-----------|-----------|---------|
| 1.1, 2.1 | Property | Свойство 1 |
| 1.2 | Property | Свойство 2 |
| 1.3 | Unit (example) | Блокировка после 5 попыток |
| 1.5 | Property | Свойство 3 |
| 2.2 | Property | Свойство 4 |
| 2.3 | Property | Свойство 5 |
| 2.4 | Property | Свойство 6 |
| 3.1 | Property | Свойство 7 |
| 3.2 | Property | Свойство 8 |
| 3.3, 5.5 | Property | Свойство 9 |
| 3.5 | Property | Свойство 10 |
| 4.1, 10.2 | Property | Свойство 11 |
| 4.4, 6.1 | Property | Свойство 12 |
| 5.2 | Property | Свойство 13 |
| 5.3 | Property | Свойство 14 |
| 5.4 | Property | Свойство 15 |
| 5.1, 10.3 | Property | Свойство 16 |
| 6.2 | Property | Свойство 17 |
| 6.3 | Property | Свойство 18 |
| 6.5 | Property | Свойство 19 |
| 7.1, 7.4, 8.4 | Property | Свойство 20 |
| 8.1 | Property | Свойство 21 |
| 8.2 | Property | Свойство 22 |
| 9.3 | Property | Свойство 23 |
| 10.4 | Property | Свойство 24 |
| 10.6 | Property | Свойство 25 |
| 10.7 | Property | Свойство 26 |
| 11.3 | Property | Свойство 27 |
| 11.2 | Property | Свойство 28 |
| 11.1 | Unit (example) | Назначение курса → FCM |
| 11.4 | Property | Свойство 28 (cron-job) |

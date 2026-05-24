import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Создаем таблицу должностей
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).unique().notNullable(); // barista, waiter, manager, etc.
    table.string('display_name', 200).notNullable(); // Бариста, Официант, Менеджер
    table.text('description');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Вставляем стандартные должности
  await knex('roles').insert([
    { name: 'barista', display_name: 'Бариста', description: 'Специалист по приготовлению кофе', sort_order: 1 },
    { name: 'waiter', display_name: 'Официант', description: 'Обслуживание гостей', sort_order: 2 },
    { name: 'manager', display_name: 'Менеджер', description: 'Управление заведением', sort_order: 3 },
    { name: 'admin', display_name: 'Администратор', description: 'Полный доступ к системе', sort_order: 4 },
  ]);

  // Удаляем старый CHECK constraint из таблицы users
  await knex.schema.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

  // Добавляем внешний ключ к таблице roles
  await knex.schema.alterTable('users', (table) => {
    table.uuid('role_id').nullable();
  });

  // Заполняем role_id на основе существующих role
  await knex.raw(`
    UPDATE users u
    SET role_id = r.id
    FROM roles r
    WHERE u.role = r.name
  `);

  // Делаем role_id обязательным и добавляем внешний ключ
  await knex.schema.alterTable('users', (table) => {
    table.uuid('role_id').notNullable().alter();
    table.foreign('role_id').references('id').inTable('roles').onDelete('RESTRICT');
  });

  // Создаем таблицу связи курсов с должностями (многие ко многим)
  await knex.schema.createTable('course_roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    
    // Уникальная пара курс-должность
    table.unique(['course_id', 'role_id']);
  });

  // Создаем индексы для быстрого поиска
  await knex.schema.raw('CREATE INDEX idx_course_roles_course ON course_roles(course_id)');
  await knex.schema.raw('CREATE INDEX idx_course_roles_role ON course_roles(role_id)');
}

export async function down(knex: Knex): Promise<void> {
  // Удаляем внешний ключ из users
  await knex.schema.alterTable('users', (table) => {
    table.dropForeign(['role_id']);
    table.dropColumn('role_id');
  });

  // Восстанавливаем старый CHECK constraint
  await knex.schema.raw(`
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('barista', 'waiter', 'manager', 'admin'))
  `);

  // Удаляем таблицы
  await knex.schema.dropTableIfExists('course_roles');
  await knex.schema.dropTableIfExists('roles');
}

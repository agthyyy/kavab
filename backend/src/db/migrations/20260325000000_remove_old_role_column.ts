import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Remove the old role column from users table
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('role');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Restore the old role column
  await knex.schema.alterTable('users', (table) => {
    table.string('role', 50).notNullable().defaultTo('barista');
  });

  // Add back the CHECK constraint
  await knex.schema.raw(`
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('barista', 'waiter', 'manager', 'admin'))
  `);

  // Populate role from role_id
  await knex.raw(`
    UPDATE users u
    SET role = r.name
    FROM roles r
    WHERE u.role_id = r.id
  `);
}

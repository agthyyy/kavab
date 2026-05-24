import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create junction table for achievements and roles (many-to-many)
  await knex.schema.createTable('achievement_roles', (table) => {
    table.uuid('achievement_id').notNullable().references('id').inTable('achievements').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.primary(['achievement_id', 'role_id']);
  });

  // Add is_global flag to achievements (if true, available to all roles)
  await knex.schema.alterTable('achievements', (table) => {
    table.boolean('is_global').defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('achievement_roles');
  
  await knex.schema.alterTable('achievements', (table) => {
    table.dropColumn('is_global');
  });
}

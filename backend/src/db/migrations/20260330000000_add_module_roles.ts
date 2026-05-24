import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('module_roles', (table) => {
    table.uuid('module_id').notNullable();
    table.uuid('role_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.primary(['module_id', 'role_id']);
    table.foreign('module_id').references('id').inTable('modules').onDelete('CASCADE');
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    
    table.index('module_id');
    table.index('role_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('module_roles');
}

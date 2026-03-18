import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash('admin123', 10)

  await knex('users')
    .insert({
      login: 'admin',
      password_hash: hash,
      full_name: 'Administrator',
      role: 'admin',
      is_active: true,
    })
    .onConflict('login')
    .ignore()

  console.log('✅ Admin user created: login=admin password=admin123')
}

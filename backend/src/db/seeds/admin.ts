import { Knex } from 'knex'
import bcrypt from 'bcryptjs'

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash('admin123', 10)

  // Находим роль админа
  const adminRole = await knex('roles').where('name', 'admin').first()
  
  if (!adminRole) {
    console.log('❌ Admin role not found. Please run migrations first.')
    return
  }

  // Создаем админа с role_id
  await knex('users')
    .insert({
      login: 'admin',
      password_hash: hash,
      full_name: 'Administrator',
      role_id: adminRole.id,
      is_active: true,
    })
    .onConflict('login')
    .ignore()

  console.log('✅ Admin user created: login=admin password=admin123')
}

'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Trophy, Award, Zap as Lightning, Users, Target as Crosshair } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  condition_type: string
  condition_value: number
  icon: string
  rarity: string
  xp_reward: number
  category: string
  is_secret: boolean
  is_global: boolean
  roles?: string[]
}

const conditionTypes = [
  'quiz_perfect',
  'quiz_perfect_first_try',
  'quiz_perfect_count',
  'quiz_passed_after_retries',
  'quiz_retake_improve',
  'streak_days',
  'lessons_count',
  'quizzes_count',
  'lessons_in_day',
  'lesson_late_night',
  'lesson_early_morning',
  'ranking_top',
]

const rarityColors = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-300',
}

const categoryIcons = {
  general: Trophy,
  mastery: Award,
  speed: Lightning,
  social: Users,
  special: Crosshair,
}

export default function AchievementsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    condition_type: 'quiz_perfect',
    condition_value: '1',
    icon: '🏆',
    rarity: 'common',
    xp_reward: '100',
    category: 'general',
    is_secret: false,
    is_global: true,
    role_ids: [] as string[],
  })

  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => (await api.get('/admin/achievements')).data,
  })

  const { data: roles = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/admin/achievements', {
        title: data.title,
        description: data.description,
        condition_type: data.condition_type,
        condition_value: Number(data.condition_value),
        icon: data.icon,
        rarity: data.rarity,
        xp_reward: Number(data.xp_reward),
        category: data.category,
        is_secret: data.is_secret,
        is_global: data.is_global,
        role_ids: data.role_ids,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['achievements'] })
      setShowForm(false)
      setForm({
        title: '',
        description: '',
        condition_type: 'quiz_perfect',
        condition_value: '1',
        icon: '🏆',
        rarity: 'common',
        xp_reward: '100',
        category: 'general',
        is_secret: false,
        is_global: true,
        role_ids: [],
      })
    },
  })

  if (isLoading) return <div>Loading...</div>

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand">Достижения</h1>
          <p className="text-gray-500 text-sm mt-1">Всего: {achievements.length} достижений</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> Новое достижение
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Новое достижение</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Название"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <input
              placeholder="Иконка (эмодзи)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <textarea
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold col-span-2"
              rows={2}
            />
            <select
              value={form.condition_type}
              onChange={(e) => setForm({ ...form, condition_type: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {conditionTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Значение условия"
              value={form.condition_value}
              onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <select
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="common">Обычное</option>
              <option value="rare">Редкое</option>
              <option value="epic">Эпическое</option>
              <option value="legendary">Легендарное</option>
            </select>
            <input
              type="number"
              placeholder="Награда XP"
              value={form.xp_reward}
              onChange={(e) => setForm({ ...form, xp_reward: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="general">Общее</option>
              <option value="mastery">Мастерство</option>
              <option value="speed">Скорость</option>
              <option value="social">Социальное</option>
              <option value="special">Особое</option>
            </select>
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={form.is_secret}
                onChange={(e) => setForm({ ...form, is_secret: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Секретное достижение</span>
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                checked={form.is_global}
                onChange={(e) => setForm({ ...form, is_global: e.target.checked, role_ids: e.target.checked ? [] : form.role_ids })}
                className="w-4 h-4"
              />
              <span className="text-sm">Доступно для всех должностей</span>
            </label>
            {!form.is_global && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Должности:</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.role_ids.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, role_ids: [...form.role_ids, role.id] })
                          } else {
                            setForm({ ...form, role_ids: form.role_ids.filter(id => id !== role.id) })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm capitalize">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(form)}
              className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-light"
            >
              Создать
            </button>
            <button onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </div>
      )}

      {Object.entries(groupedAchievements).map(([category, items]) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons] || Trophy
        return (
          <div key={category} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Icon size={20} className="text-brand" />
              <h2 className="text-lg font-semibold capitalize">{category}</h2>
              <span className="text-sm text-gray-500">({items.length})</span>
            </div>
            <div className="grid gap-4">
              {items.map((a) => (
                <div key={a.id} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-3xl">
                    {a.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.is_secret && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Секретное
                        </span>
                      )}
                      {!a.is_global && a.roles && a.roles.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {a.roles.map((r: any) => r.name).join(', ')}
                        </span>
                      )}
                      {a.is_global && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Все должности
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{a.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-3 py-1 rounded-full border ${rarityColors[a.rarity as keyof typeof rarityColors]}`}>
                      {a.rarity}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">{a.condition_type}: {a.condition_value}</p>
                    <p className="text-sm font-semibold text-gold mt-1">+{a.xp_reward} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

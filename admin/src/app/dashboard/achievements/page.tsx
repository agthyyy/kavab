'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus } from 'lucide-react'

interface Achievement {
  id: string
  name: string
  description: string
  condition_type: string
  condition_value: number
}

const conditionTypes = ['quiz_perfect', 'streak_days', 'lessons_count']

export default function AchievementsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    condition_type: 'quiz_perfect',
    condition_value: '1',
  })

  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => (await api.get('/admin/achievements')).data,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/admin/achievements', {
        ...data,
        condition_value: Number(data.condition_value),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['achievements'] })
      setShowForm(false)
      setForm({ name: '', description: '', condition_type: 'quiz_perfect', condition_value: '1' })
    },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Achievements</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> New Achievement
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">New Achievement</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
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
              placeholder="Condition value"
              value={form.condition_value}
              onChange={(e) => setForm({ ...form, condition_value: e.target.value })}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => createMutation.mutate(form)}
              className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-light"
            >
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {achievements.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-2xl">
              🏆
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{a.name}</h3>
              <p className="text-gray-500 text-sm">{a.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded">
                {a.condition_type}
              </span>
              <p className="text-sm text-gray-500 mt-1">Value: {a.condition_value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

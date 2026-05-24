'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Plus, Send, Users } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  is_published: boolean
}

interface Role {
  id: string
  name: string
  displayName: string
}

export default function CoursesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [managingRoles, setManagingRoles] = useState<string | null>(null)

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/admin/courses')).data,
  })

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/admin/roles')).data,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/admin/courses', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); setShowForm(false); setForm({ title: '', description: '' }) },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/courses/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Курсы</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> Новый курс
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Новый курс</h2>
          <div className="space-y-3">
            <input
              placeholder="Название"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <textarea
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
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

      <div className="grid gap-4">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{c.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {c.is_published ? 'Опубликован' : 'Черновик'}
                </span>
                {!c.is_published && (
                  <button
                    onClick={() => publishMutation.mutate(c.id)}
                    className="flex items-center gap-1 text-sm text-brand hover:underline"
                  >
                    <Send size={14} /> Опубликовать
                  </button>
                )}
                <Link
                  href={`/dashboard/courses/${c.id}`}
                  className="text-sm text-brand hover:underline"
                >
                  Редактировать →
                </Link>
              </div>
            </div>
            
            <div className="border-t pt-3 mt-3">
              <button
                onClick={() => setManagingRoles(managingRoles === c.id ? null : c.id)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand"
              >
                <Users size={16} />
                Управление доступом по должностям
              </button>
              
              {managingRoles === c.id && (
                <CourseRolesManager courseId={c.id} roles={roles} onClose={() => setManagingRoles(null)} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CourseRolesManager({ courseId, roles, onClose }: { courseId: string; roles: Role[]; onClose: () => void }) {
  const qc = useQueryClient()
  
  const { data: courseRoles = [], isLoading } = useQuery<string[]>({
    queryKey: ['courseRoles', courseId],
    queryFn: async () => {
      const response = await api.get(`/admin/courses/${courseId}/roles`)
      return response.data.roles || []
    },
  })

  const setRolesMutation = useMutation({
    mutationFn: (roleIds: string[]) => {
      // Фильтруем null/undefined значения
      const validRoleIds = roleIds.filter(id => id != null && id !== '')
      console.log('Sending roleIds:', validRoleIds)
      return api.post(`/admin/courses/${courseId}/roles`, { roleIds: validRoleIds })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courseRoles', courseId] })
      onClose()
    },
  })

  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Update selected roles when data loads - всегда обновляем, даже если пустой массив
  useEffect(() => {
    setSelectedRoles(courseRoles)
  }, [courseRoles])

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

  if (isLoading) return <div className="mt-3 text-sm text-gray-500">Загрузка...</div>

  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-3">
        Выберите должности, которым доступен этот курс. Если не выбрано ни одной должности, курс доступен всем.
      </p>
      
      <div className="space-y-2 mb-4">
        {roles.map(role => (
          <label key={role.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role.id)}
              onChange={() => toggleRole(role.id)}
              className="w-4 h-4 text-brand focus:ring-gold rounded"
            />
            <span className="text-sm">{role.displayName}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setRolesMutation.mutate(selectedRoles)}
          disabled={setRolesMutation.isPending}
          className="bg-brand text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-light disabled:opacity-50"
        >
          {setRolesMutation.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          onClick={onClose}
          className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

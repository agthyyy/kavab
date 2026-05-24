'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Edit, Trash, Check, X } from 'lucide-react'

interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  isActive: boolean
  sortOrder: number
}

export default function RolesPage() {
  const qc = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', displayName: '', description: '' })
  const [editForm, setEditForm] = useState({ displayName: '', description: '', sortOrder: 0 })

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles?includeInactive=true')).data,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof createForm) => api.post('/roles', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setShowCreateForm(false)
      setCreateForm({ name: '', displayName: '', description: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) => api.put(`/roles/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setEditingRole(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Не удалось удалить должность')
    },
  })

  const startEdit = (role: Role) => {
    setEditingRole(role.id)
    setEditForm({
      displayName: role.displayName,
      description: role.description || '',
      sortOrder: role.sortOrder,
    })
  }

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Управление должностями</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> Добавить должность
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Новая должность</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Системное имя (латиница, без пробелов)
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="barista"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Отображаемое название
              </label>
              <input
                type="text"
                value={createForm.displayName}
                onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                placeholder="Бариста"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание (опционально)
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Специалист по приготовлению кофе"
                rows={3}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate(createForm)}
                disabled={!createForm.name || !createForm.displayName}
                className="bg-brand text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Создать
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="border px-4 py-2 rounded-lg"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Должность</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Системное имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порядок</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {roles.map((role) => (
              <tr key={role.id} className={!role.isActive ? 'opacity-50' : ''}>
                {editingRole === role.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{role.name}</td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={editForm.sortOrder}
                        onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
                        className="w-20 border rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {role.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: role.id, data: editForm })}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingRole(null)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-medium">{role.displayName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{role.description || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{role.sortOrder}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${role.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {role.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(role)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить должность "${role.displayName}"?`)) {
                              deleteMutation.mutate(role.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

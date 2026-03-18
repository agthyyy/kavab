'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { UserPlus, Pencil, UserX } from 'lucide-react'

interface User {
  id: string
  login: string
  full_name: string
  role: string
  is_active: boolean
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/admin/users')
      return Array.isArray(res.data) ? res.data : (res.data?.users ?? [])
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.post('/admin/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/admin/users/${id}`, {
        full_name: data.full_name,
        role: data.role,
        isActive: data.is_active,
        password: data.password,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null) },
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Employees</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      {showForm && <UserForm onSubmit={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}
      {editUser && (
        <UserForm
          initial={editUser}
          onSubmit={(d) => updateMutation.mutate({ id: editUser.id, data: d })}
          onCancel={() => setEditUser(null)}
        />
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['Name', 'Login', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{u.full_name}</td>
                <td className="px-6 py-4 text-gray-500">{u.login}</td>
                <td className="px-6 py-4">
                  <span className="bg-brand/10 text-brand px-2 py-1 rounded text-xs font-medium">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setEditUser(u)} className="text-gray-400 hover:text-brand">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: u.id, data: { isActive: !u.is_active } })}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <UserX size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: User
  onSubmit: (d: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    login: initial?.login ?? '',
    full_name: initial?.full_name ?? '',
    role: initial?.role ?? 'barista',
    password: '',
  })

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4">{initial ? 'Edit Employee' : 'New Employee'}</h2>
      <div className="grid grid-cols-2 gap-4">
        {(['full_name', 'login'] as const).map((f) => (
          <input
            key={f}
            placeholder={f === 'full_name' ? 'Full Name' : 'Login'}
            value={form[f]}
            onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        ))}
        {!initial && (
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        )}
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="barista">Barista</option>
          <option value="waiter">Waiter</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onSubmit(form)}
          className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-light"
        >
          Save
        </button>
        <button onClick={onCancel} className="border px-6 py-2 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

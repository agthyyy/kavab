'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { UserPlus, Pencil, UserX } from 'lucide-react'

interface User {
  id: string
  login: string
  full_name: string
  fullName: string
  role: string
  roleId: string
  role_id: string
  is_active: boolean
  isActive: boolean
}

interface Role {
  id: string
  name: string
  displayName: string
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

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.post('/admin/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowForm(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/admin/users/${id}`, {
        fullName: data.fullName,
        roleId: data.roleId,
        isActive: data.isActive,
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

      {showForm && <UserForm roles={roles} onSubmit={(d) => createMutation.mutate(d)} onCancel={() => setShowForm(false)} />}
      {editUser && (
        <UserForm
          roles={roles}
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
                <td className="px-6 py-4 font-medium">{u.fullName || u.full_name}</td>
                <td className="px-6 py-4 text-gray-500">{u.login}</td>
                <td className="px-6 py-4">
                  <span className="bg-brand/10 text-brand px-2 py-1 rounded text-xs font-medium">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${(u.isActive ?? u.is_active) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {(u.isActive ?? u.is_active) ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button onClick={() => setEditUser(u)} className="text-gray-400 hover:text-brand">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: u.id, data: { isActive: !(u.isActive ?? u.is_active) } })}
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
  roles,
  initial,
  onSubmit,
  onCancel,
}: {
  roles: Role[]
  initial?: User
  onSubmit: (d: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    login: initial?.login ?? '',
    fullName: initial?.fullName || initial?.full_name || '',
    roleId: initial?.roleId || initial?.role_id || (roles[0]?.id ?? ''),
    password: '',
  })

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="font-semibold text-lg mb-4">{initial ? 'Edit Employee' : 'New Employee'}</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <input
          placeholder="Login"
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
          disabled={!!initial}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold disabled:bg-gray-100"
        />
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
          value={form.roleId}
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.displayName}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onSubmit({ ...form, full_name: form.fullName, role_id: form.roleId })}
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

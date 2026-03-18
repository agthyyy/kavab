'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Plus, Send } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  is_published: boolean
}

export default function CoursesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => (await api.get('/admin/courses')).data,
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
        <h1 className="text-2xl font-bold text-brand">Courses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> New Course
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">New Course</h2>
          <div className="space-y-3">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <textarea
              placeholder="Description"
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
              Create
            </button>
            <button onClick={() => setShowForm(false)} className="border px-6 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{c.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {c.is_published ? 'Published' : 'Draft'}
              </span>
              {!c.is_published && (
                <button
                  onClick={() => publishMutation.mutate(c.id)}
                  className="flex items-center gap-1 text-sm text-brand hover:underline"
                >
                  <Send size={14} /> Publish
                </button>
              )}
              <Link
                href={`/dashboard/courses/${c.id}`}
                className="text-sm text-brand hover:underline"
              >
                Edit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

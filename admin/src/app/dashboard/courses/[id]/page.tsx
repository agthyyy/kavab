'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'

interface Module { id: string; title: string; order_index: number }
interface Lesson { id: string; title: string; description: string | null; xp_reward: number; order_index: number }
interface Quiz { id: string; xp_max: number; pass_threshold: number }

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()
  const courseId = params.id
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules', courseId],
    queryFn: async () => (await api.get(`/admin/courses/${courseId}/modules`)).data,
  })

  const addModuleMutation = useMutation({
    mutationFn: (title: string) =>
      api.post('/admin/modules', { course_id: courseId, title, order_index: modules.length + 1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modules', courseId] })
      setNewModuleTitle('')
      setShowModuleForm(false)
    },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand">Course Modules</h1>
        <button
          onClick={() => setShowModuleForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> Add Module
        </button>
      </div>

      {showModuleForm && (
        <div className="bg-white rounded-xl shadow p-4 mb-4 flex gap-3">
          <input
            placeholder="Module title"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <button
            onClick={() => addModuleMutation.mutate(newModuleTitle)}
            className="bg-brand text-white px-4 py-2 rounded-lg"
          >
            Add
          </button>
          <button onClick={() => setShowModuleForm(false)} className="border px-4 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      )}

      <div className="space-y-3">
        {modules.map((m) => (
          <ModuleRow
            key={m.id}
            module={m}
            expanded={expandedModule === m.id}
            onToggle={() => setExpandedModule(expandedModule === m.id ? null : m.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ModuleRow({ module, expanded, onToggle }: { module: Module; expanded: boolean; onToggle: () => void }) {
  const qc = useQueryClient()
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', xp_reward: '50' })

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['lessons', module.id],
    queryFn: async () => (await api.get(`/admin/modules/${module.id}/lessons`)).data,
    enabled: expanded,
  })

  const addLessonMutation = useMutation({
    mutationFn: (data: typeof lessonForm) =>
      api.post('/admin/lessons', {
        module_id: module.id,
        title: data.title,
        description: data.description,
        xp_reward: Number(data.xp_reward),
        order_index: lessons.length + 1,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons', module.id] })
      setShowLessonForm(false)
      setLessonForm({ title: '', description: '', xp_reward: '50' })
    },
  })

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-left"
      >
        {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <span className="font-semibold">{module.title}</span>
        <span className="ml-auto text-xs text-gray-400">{lessons.length} lessons</span>
      </button>

      {expanded && (
        <div className="border-t px-6 py-4 space-y-2">
          {lessons.map((l) => (
            <LessonRow
              key={l.id}
              lesson={l}
              expanded={expandedLesson === l.id}
              onToggle={() => setExpandedLesson(expandedLesson === l.id ? null : l.id)}
            />
          ))}

          {showLessonForm ? (
            <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-3">
              <p className="text-sm font-medium text-gray-700">New Lesson</p>
              <input
                placeholder="Lesson title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <textarea
                placeholder="Lesson description (optional)"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">XP reward:</label>
                <input
                  type="number"
                  value={lessonForm.xp_reward}
                  onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: e.target.value })}
                  className="w-24 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => addLessonMutation.mutate(lessonForm)}
                  disabled={!lessonForm.title.trim()}
                  className="bg-brand text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Save Lesson
                </button>
                <button
                  onClick={() => setShowLessonForm(false)}
                  className="border px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLessonForm(true)}
              className="flex items-center gap-1 text-sm text-brand hover:underline pt-2"
            >
              <Plus size={14} /> Add Lesson
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LessonRow({ lesson, expanded, onToggle }: { lesson: Lesson; expanded: boolean; onToggle: () => void }) {
  const qc = useQueryClient()
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [quizForm, setQuizForm] = useState({ xp_max: '50', pass_threshold: '80' })

  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz | null>({
    queryKey: ['lesson-quiz', lesson.id],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/lessons/${lesson.id}/quiz`)
        return res.data?.quiz ?? null
      } catch {
        return null
      }
    },
    enabled: expanded,
  })

  const createQuizMutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/lessons/${lesson.id}/quiz`, {
        xp_max: Number(quizForm.xp_max),
        pass_threshold: Number(quizForm.pass_threshold),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-quiz', lesson.id] })
      setShowQuizForm(false)
    },
  })

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
      >
        <BookOpen size={15} className="text-gray-400 shrink-0" />
        <span className="text-sm font-medium flex-1">{lesson.title}</span>
        <span className="text-xs text-gold font-medium mr-2">+{lesson.xp_reward} XP</span>
        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>

      {expanded && (
        <div className="border-t bg-gray-50 px-4 py-3 space-y-3">
          {lesson.description && (
            <p className="text-sm text-gray-600">{lesson.description}</p>
          )}

          <div className="flex items-center gap-2">
            <BookOpen size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Quiz</span>
          </div>

          {quizLoading ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : quiz ? (
            <div className="bg-white rounded-lg px-4 py-3 text-sm space-y-1">
              <p className="text-gray-600">Max XP: <span className="font-medium text-gold">{quiz.xp_max}</span></p>
              <p className="text-gray-600">Pass threshold: <span className="font-medium">{quiz.pass_threshold}%</span></p>
              <a
                href={`/dashboard/quizzes/${quiz.id}`}
                className="text-xs text-brand hover:underline"
              >
                Edit questions →
              </a>
            </div>
          ) : showQuizForm ? (
            <div className="bg-white rounded-lg p-3 space-y-2">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Max XP</label>
                  <input
                    type="number"
                    value={quizForm.xp_max}
                    onChange={(e) => setQuizForm({ ...quizForm, xp_max: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Pass % (1-100)</label>
                  <input
                    type="number"
                    value={quizForm.pass_threshold}
                    onChange={(e) => setQuizForm({ ...quizForm, pass_threshold: e.target.value })}
                    className="w-full border rounded px-2 py-1 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createQuizMutation.mutate()}
                  className="bg-brand text-white px-3 py-1.5 rounded text-xs"
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => setShowQuizForm(false)}
                  className="border px-3 py-1.5 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQuizForm(true)}
              className="flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <Plus size={12} /> Add Quiz to this lesson
            </button>
          )}
        </div>
      )}
    </div>
  )
}

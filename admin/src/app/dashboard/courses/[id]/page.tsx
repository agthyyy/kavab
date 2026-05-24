'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'

interface Module { id: string; title: string; order_index: number }
interface Lesson { id: string; title: string; description: string | null; xp_reward: number; order_index: number }
interface Quiz { id: string; xp_max: number; pass_threshold: number }
interface Role { id: string; name: string; displayName: string }

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()
  const courseId = params.id
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)

  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules', courseId],
    queryFn: async () => (await api.get(`/admin/courses/${courseId}/modules`)).data,
  })

  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  })

  const { data: courseRoles = [] } = useQuery<Role[]>({
    queryKey: ['course-roles', courseId],
    queryFn: async () => (await api.get(`/admin/courses/${courseId}/roles`)).data.roles,
  })

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  // Update selected roles when courseRoles loads
  useState(() => {
    if (courseRoles.length > 0) {
      setSelectedRoleIds(courseRoles.map(r => r.id))
    }
  })

  const updateRolesMutation = useMutation({
    mutationFn: (roleIds: string[]) =>
      api.post(`/admin/courses/${courseId}/roles`, { roleIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['course-roles', courseId] })
      setShowRoleSelector(false)
    },
  })

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

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
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedRoleIds(courseRoles.map(r => r.id))
              setShowRoleSelector(true)
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Назначить должности
          </button>
          <button
            onClick={() => setShowModuleForm(true)}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
          >
            <Plus size={18} /> Add Module
          </button>
        </div>
      </div>

      {/* Role Selector */}
      {showRoleSelector && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Выберите должности для курса</h2>
          <p className="text-sm text-gray-600 mb-4">
            Курс будет доступен только сотрудникам с выбранными должностями. Если не выбрать ни одну должность, курс будет доступен всем.
          </p>
          <div className="space-y-2 mb-4">
            {allRoles.map(role => (
              <label key={role.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="w-4 h-4 text-brand focus:ring-gold"
                />
                <span className="font-medium">{role.displayName}</span>
                <span className="text-sm text-gray-500">({role.name})</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => updateRolesMutation.mutate(selectedRoleIds)}
              className="bg-brand text-white px-4 py-2 rounded-lg"
            >
              Сохранить
            </button>
            <button
              onClick={() => setShowRoleSelector(false)}
              className="border px-4 py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Current Roles Display */}
      {courseRoles.length > 0 && !showRoleSelector && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-purple-900 mb-2">Курс доступен для должностей:</p>
          <div className="flex flex-wrap gap-2">
            {courseRoles.map(role => (
              <span key={role.id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {role.displayName}
              </span>
            ))}
          </div>
        </div>
      )}

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
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['lessons', module.id],
    queryFn: async () => (await api.get(`/admin/modules/${module.id}/lessons`)).data,
    enabled: expanded,
  })

  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => (await api.get('/roles')).data,
  })

  const { data: moduleRoles = [] } = useQuery<Role[]>({
    queryKey: ['module-roles', module.id],
    queryFn: async () => (await api.get(`/admin/modules/${module.id}/roles`)).data.roles,
    // Always load roles to show indicators even when collapsed
  })

  const updateModuleRolesMutation = useMutation({
    mutationFn: (roleIds: string[]) =>
      api.post(`/admin/modules/${module.id}/roles`, { roleIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['module-roles', module.id] })
      setShowRoleSelector(false)
    },
  })

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    )
  }

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
      <div className="w-full flex items-center gap-3 px-6 py-4">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 hover:bg-gray-50 rounded-lg p-2 -m-2"
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span className="font-semibold">{module.title}</span>
          <span className="ml-auto text-xs text-gray-400">{lessons.length} lessons</span>
        </button>
        
        {/* Quick role indicator and button */}
        <div className="flex items-center gap-2">
          {moduleRoles && moduleRoles.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {moduleRoles.slice(0, 3).map(role => (
                  <span 
                    key={role.id} 
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border-2 border-white"
                    title={role.displayName || ''}
                  >
                    {role.displayName ? role.displayName.charAt(0) : '?'}
                  </span>
                ))}
                {moduleRoles.length > 3 && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-medium border-2 border-white">
                    +{moduleRoles.length - 3}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedRoleIds(moduleRoles.map(r => r.id))
                  setShowRoleSelector(true)
                }}
                className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
              >
                Изменить
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setSelectedRoleIds([])
                setShowRoleSelector(true)
              }}
              className="text-xs text-gray-500 hover:text-brand hover:underline flex items-center gap-1"
            >
              <Plus size={12} />
              Назначить должности
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-6 py-4 space-y-4">
          {/* Module Roles Section - Always visible when expanded */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-purple-900">Доступ по должностям</h3>
                <p className="text-xs text-purple-700 mt-1">
                  {moduleRoles && moduleRoles.length > 0 
                    ? `Модуль доступен только для: ${moduleRoles.map(r => r.displayName).join(', ')}`
                    : 'Модуль доступен для всех сотрудников'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedRoleIds(moduleRoles ? moduleRoles.map(r => r.id) : [])
                  setShowRoleSelector(!showRoleSelector)
                }}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700 flex items-center gap-1"
              >
                {showRoleSelector ? 'Скрыть' : 'Настроить'}
              </button>
            </div>

            {showRoleSelector && (
              <div className="bg-white rounded-lg p-4 space-y-3 mt-3">
                <p className="text-xs text-gray-600">
                  Выберите должности, для которых будет доступен этот модуль. Если не выбрать ни одну, модуль будет доступен всем.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allRoles.map(role => (
                    <label key={role.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">{role.displayName}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => updateModuleRolesMutation.mutate(selectedRoleIds)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setShowRoleSelector(false)}
                    className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lessons list */}
          <div className="space-y-2">
            {lessons.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                expanded={expandedLesson === l.id}
                onToggle={() => setExpandedLesson(expandedLesson === l.id ? null : l.id)}
              />
            ))}
          </div>

          {showLessonForm ? (
            <div className="bg-gray-50 rounded-lg p-4 mt-3 space-y-3">
              <p className="text-sm font-medium text-gray-700">New Lesson</p>
              <input
                placeholder="Lesson title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <RichTextEditor
                value={lessonForm.description}
                onChange={(description) => setLessonForm({ ...lessonForm, description })}
                placeholder="Описание урока (необязательно)"
                className="w-full"
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
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [quizForm, setQuizForm] = useState({ xp_max: '50', pass_threshold: '80' })
  const [blockForm, setBlockForm] = useState({ blockType: 'text', content: '', orderIndex: 1 })
  const [uploading, setUploading] = useState(false)

  const { data: lessonBlocks = [] } = useQuery({
    queryKey: ['lesson-blocks', lesson.id],
    queryFn: async () => {
      try {
        const res = await api.get(`/content/lesson/${lesson.id}`)
        return res.data?.blocks || []
      } catch {
        return []
      }
    },
    enabled: expanded,
  })

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

  const addBlockMutation = useMutation({
    mutationFn: (data: typeof blockForm) =>
      api.post(`/admin/lessons/${lesson.id}/blocks`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-blocks', lesson.id] })
      setShowBlockForm(false)
      setBlockForm({ blockType: 'text', content: '', orderIndex: lessonBlocks.length + 1 })
    },
  })

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      // Создаем FormData для загрузки файла
      const formData = new FormData()
      formData.append('file', file)

      // Загружаем файл напрямую
      const uploadRes = await api.post('/admin/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const { publicUrl } = uploadRes.data

      // Добавляем блок с изображением
      await addBlockMutation.mutateAsync({
        blockType: 'image',
        content: publicUrl,
        orderIndex: blockForm.orderIndex,
      })

      alert('Изображение успешно загружено!')
    } catch (error: any) {
      alert('Ошибка загрузки: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

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
            <span className="text-sm font-medium text-gray-700">Контент урока</span>
            <span className="text-xs text-gray-500">({lessonBlocks.length} блоков)</span>
          </div>

          {/* Существующие блоки */}
          {lessonBlocks.length > 0 && (
            <div className="space-y-2 mb-3">
              {lessonBlocks.map((block: any, index: number) => (
                <div key={block.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {block.blockType === 'text' ? '📝 Текст' : 
                         block.blockType === 'image' ? '🖼️ Изображение' : '🎥 Видео'}
                      </span>
                    </div>
                    {block.blockType === 'text' && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {block.content?.substring(0, 100)}...
                      </p>
                    )}
                    {block.blockType === 'image' && (
                      <img 
                        src={block.content} 
                        alt="Превью" 
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления контента */}
          {showBlockForm ? (
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={blockForm.blockType}
                  onChange={(e) => setBlockForm({ ...blockForm, blockType: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="text">Текст</option>
                  <option value="image">Изображение</option>
                  <option value="video">Видео</option>
                </select>
                <input
                  type="number"
                  placeholder="Порядок"
                  value={blockForm.orderIndex}
                  onChange={(e) => setBlockForm({ ...blockForm, orderIndex: Number(e.target.value) })}
                  className="w-24 border rounded px-3 py-2 text-sm"
                  min={1}
                  max={lessonBlocks.length + 10}
                />
              </div>

              {blockForm.blockType === 'text' && (
                <RichTextEditor
                  value={blockForm.content}
                  onChange={(content) => setBlockForm({ ...blockForm, content })}
                  placeholder="Введите текст урока..."
                  className="w-full"
                />
              )}

              {blockForm.blockType === 'image' && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={uploading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">Поддерживаются: JPEG, PNG, WebP (макс. 10 МБ)</p>
                </div>
              )}

              {blockForm.blockType === 'video' && (
                <input
                  placeholder="URL видео или путь к файлу"
                  value={blockForm.content}
                  onChange={(e) => setBlockForm({ ...blockForm, content: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              )}

              <div className="flex gap-2">
                {blockForm.blockType !== 'image' && (
                  <button
                    onClick={() => addBlockMutation.mutate(blockForm)}
                    disabled={!blockForm.content}
                    className="bg-brand text-white px-3 py-1.5 rounded text-xs disabled:opacity-50"
                  >
                    Добавить
                  </button>
                )}
                <button
                  onClick={() => setShowBlockForm(false)}
                  className="border px-3 py-1.5 rounded text-xs"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBlockForm(true)}
              className="flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <Plus size={12} /> Добавить контент
            </button>
          )}

          <div className="flex items-center gap-2 mt-4">
            <BookOpen size={15} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Достижения урока</span>
          </div>

          {/* Здесь будет компонент для управления достижениями урока */}
          <div className="bg-white rounded-lg px-4 py-3 text-sm">
            <p className="text-xs text-gray-500 mb-2">
              Достижения, которые получат пользователи при завершении этого урока
            </p>
            <button
              className="flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <Plus size={12} /> Привязать достижение
            </button>
          </div>

          <div className="flex items-center gap-2 mt-4">
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
                className="text-xs text-brand hover:underline block"
              >
                Редактировать вопросы →
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

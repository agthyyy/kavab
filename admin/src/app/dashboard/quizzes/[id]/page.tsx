'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Edit, Trash, Check, X } from 'lucide-react'

interface Question {
  id: string
  questionType: string
  text: string
  imageUrl?: string
  explanation?: string
  orderIndex: number
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
    matchPair?: string
  }>
}

interface Quiz {
  id: string
  xpMax: number
  passThreshold: number
}

export default function QuizQuestionsPage({ params }: { params: { id: string } }) {
  const qc = useQueryClient()
  const quizId = params.id
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => (await api.get(`/admin/quizzes/${quizId}`)).data,
  })

  const quiz = quizData?.quiz as Quiz
  const questions = (quizData?.questions as Question[]) || []

  const addQuestionMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Отправляем данные вопроса:', data)
      return api.post(`/admin/quizzes/${quizId}/questions`, data)
    },
    onSuccess: (response) => {
      console.log('Вопрос создан успешно:', response.data)
      qc.invalidateQueries({ queryKey: ['quiz', quizId] })
      setShowQuestionForm(false)
    },
    onError: (error: any) => {
      console.error('Ошибка создания вопроса:', error)
      alert('Ошибка создания вопроса: ' + (error.response?.data?.message || error.message))
    },
  })

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand">Вопросы теста</h1>
          <p className="text-gray-600">
            Проходной балл: {quiz?.passThreshold}% | Макс. XP: {quiz?.xpMax}
          </p>
        </div>
        <button
          onClick={() => setShowQuestionForm(true)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-light"
        >
          <Plus size={18} /> Добавить вопрос
        </button>
      </div>

      {showQuestionForm && (
        <QuestionForm
          onSubmit={(data) => addQuestionMutation.mutate(data)}
          onCancel={() => setShowQuestionForm(false)}
          orderIndex={questions.length + 1}
          uploading={uploading}
          setUploading={setUploading}
        />
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index + 1}
            onEdit={() => setEditingQuestion(question.id)}
          />
        ))}
      </div>
    </div>
  )
}

function QuestionForm({
  onSubmit,
  onCancel,
  orderIndex,
  uploading,
  setUploading,
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
  orderIndex: number
  uploading: boolean
  setUploading: (uploading: boolean) => void
}) {
  const [form, setForm] = useState({
    questionType: 'single',
    text: '',
    imageUrl: '',
    explanation: '',
    orderIndex,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ],
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

      // Используем реальный URL
      setForm({ ...form, imageUrl: publicUrl })
      alert('Изображение успешно загружено!')
    } catch (error: any) {
      alert('Ошибка загрузки: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const addOption = () => {
    setForm({
      ...form,
      options: [...form.options, { text: '', isCorrect: false }],
    })
  }

  const updateOption = (index: number, field: string, value: any) => {
    const updated = [...form.options]
    
    if (field === 'isCorrect') {
      if (form.questionType === 'single') {
        // Для одиночного выбора - снимаем все остальные галочки
        updated.forEach((opt, i) => {
          opt.isCorrect = i === index ? value : false
        })
      } else {
        // Для множественного выбора - просто обновляем текущий
        updated[index] = { ...updated[index], [field]: value }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    
    setForm({ ...form, options: updated })
  }

  const removeOption = (index: number) => {
    if (form.options.length > 2) {
      const updated = form.options.filter((_, i) => i !== index)
      setForm({ ...form, options: updated })
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Новый вопрос</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип вопроса
          </label>
          <select
            value={form.questionType}
            onChange={(e) => {
              const newType = e.target.value
              let newOptions = form.options
              
              if (newType === 'true_false') {
                // Для правда/ложь создаем специальные варианты
                newOptions = [
                  { text: 'Правда', isCorrect: true },
                  { text: 'Ложь', isCorrect: false },
                ]
              } else if (form.questionType === 'true_false') {
                // Если переключаемся с правда/ложь, создаем обычные варианты
                newOptions = [
                  { text: '', isCorrect: true },
                  { text: '', isCorrect: false },
                ]
              }
              
              setForm({ ...form, questionType: newType, options: newOptions })
            }}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="single">Один правильный ответ</option>
            <option value="multiple">Несколько правильных ответов</option>
            <option value="true_false">Правда/Ложь</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст вопроса
          </label>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={3}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            placeholder="Введите текст вопроса..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Изображение (опционально)
          </label>
          {form.imageUrl ? (
            <div className="space-y-2">
              <img
                src={form.imageUrl}
                alt="Превью"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
              <button
                onClick={() => setForm({ ...form, imageUrl: '' })}
                className="text-red-600 text-sm hover:underline"
              >
                Удалить изображение
              </button>
            </div>
          ) : (
            <div>
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
              <p className="text-xs text-gray-500 mt-1">
                Поддерживаются: JPEG, PNG, WebP (макс. 10 МБ)
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Объяснение (опционально)
          </label>
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            rows={2}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
            placeholder="Объяснение правильного ответа..."
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Варианты ответов
              {form.questionType === 'single' && (
                <span className="text-xs text-gray-500 ml-2">(выберите один правильный)</span>
              )}
              {form.questionType === 'multiple' && (
                <span className="text-xs text-gray-500 ml-2">(можно выбрать несколько)</span>
              )}
            </label>
            <button
              onClick={addOption}
              className="text-brand text-sm hover:underline"
              disabled={form.questionType === 'true_false'}
            >
              + Добавить вариант
            </button>
          </div>
          
          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                {form.questionType === 'single' ? (
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                    className="w-4 h-4 text-brand focus:ring-gold"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                    className="w-4 h-4 text-brand focus:ring-gold"
                  />
                )}
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, 'text', e.target.value)}
                  placeholder={`Вариант ${index + 1}`}
                  disabled={form.questionType === 'true_false'}
                  className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold disabled:bg-gray-100"
                />
                {form.options.length > 2 && form.questionType !== 'true_false' && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onSubmit(form)}
          disabled={!form.text || form.options.every(o => !o.text) || !form.options.some(o => o.isCorrect) || uploading}
          className="bg-brand text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? 'Загрузка...' : 'Создать вопрос'}
        </button>
        <button
          onClick={onCancel}
          className="border px-4 py-2 rounded-lg"
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  onEdit,
}: {
  question: Question
  index: number
  onEdit: () => void
}) {
  const correctOptions = question.options.filter(o => o.isCorrect)
  
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-brand text-white px-2 py-1 rounded text-sm font-medium">
              Вопрос {index}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {question.questionType === 'single' ? 'Один ответ' : 
               question.questionType === 'multiple' ? 'Несколько ответов' : 'Правда/Ложь'}
            </span>
          </div>
          <p className="text-gray-900 mb-3">{question.text}</p>
          
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Изображение к вопросу"
              className="w-full max-w-md h-32 object-cover rounded-lg border mb-3"
            />
          )}
          
          <div className="space-y-1">
            {question.options.map((option, i) => (
              <div
                key={option.id}
                className={`flex items-center gap-2 p-2 rounded ${
                  option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  option.isCorrect ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {option.isCorrect && <Check size={10} className="text-white" />}
                </div>
                <span className="text-sm">{option.text}</span>
              </div>
            ))}
          </div>
          
          {question.explanation && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Объяснение:</strong> {question.explanation}
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-brand ml-4"
        >
          <Edit size={18} />
        </button>
      </div>
    </div>
  )
}
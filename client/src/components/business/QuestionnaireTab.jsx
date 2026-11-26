import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import EmptyState from '../ui/EmptyState'
import { businessesApi } from '../../services/api'

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_text', label: 'Optional Short Text' },
]

const TYPE_LABELS = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  short_text: 'Optional Short Text',
}

const SEMANTIC_CATEGORIES = [
  { id: 'staff_behaviour', label: 'Staff Behaviour' },
  { id: 'food_quality', label: 'Food Quality' },
  { id: 'product_quality', label: 'Product Quality' },
  { id: 'service_speed', label: 'Service Speed' },
  { id: 'service_quality', label: 'Service Quality' },
  { id: 'cleanliness', label: 'Cleanliness' },
  { id: 'ambience', label: 'Ambience' },
  { id: 'pricing', label: 'Pricing & Value' },
  { id: 'delivery_experience', label: 'Delivery Experience' },
  { id: 'communication', label: 'Communication' },
  { id: 'professionalism', label: 'Professionalism' },
  { id: 'technical_expertise', label: 'Technical Expertise' },
  { id: 'appointment_experience', label: 'Appointment Experience' },
  { id: 'comfort', label: 'Comfort' },
  { id: 'overall_experience', label: 'Overall Experience' },
  { id: 'custom', label: 'Custom' },
]

const CATEGORY_LABELS = Object.fromEntries(
  SEMANTIC_CATEGORIES.map((c) => [c.id, c.label]),
)

const emptyQuestion = {
  text: '',
  category: 'custom',
  customContext: '',
  type: 'single_choice',
  required: true,
  options: [''],
}

export default function QuestionnaireTab({ questions = [], onChange }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(emptyQuestion)
  const [manualCategory, setManualCategory] = useState(false)
  const [suggestedLabel, setSuggestedLabel] = useState('')

  useEffect(() => {
    if ((!isAdding && !editingId) || manualCategory) return undefined
    const text = draft.text.trim()
    if (text.length < 4) return undefined

    const timer = setTimeout(() => {
      businessesApi
        .classifyQuestion(text)
        .then((res) => {
          if (res?.category) {
            setDraft((prev) => ({ ...prev, category: res.category }))
            setSuggestedLabel(res.label || '')
          }
        })
        .catch(() => {})
    }, 250)

    return () => clearTimeout(timer)
  }, [draft.text, isAdding, editingId, manualCategory])

  const startAdd = () => {
    setEditingId(null)
    setManualCategory(false)
    setSuggestedLabel('')
    setDraft(emptyQuestion)
    setIsAdding(true)
  }

  const startEdit = (q) => {
    setIsAdding(false)
    setEditingId(q.id)
    setManualCategory(Boolean(q.category))
    setSuggestedLabel('')
    setDraft({
      text: q.text,
      category: q.category || 'custom',
      customContext: q.customContext || '',
      type: q.type,
      required: q.required,
      options: q.options?.length ? [...q.options] : [''],
    })
  }

  const cancelForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setManualCategory(false)
    setSuggestedLabel('')
    setDraft(emptyQuestion)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!draft.text.trim()) return

    const cleanedOptions =
      draft.type === 'short_text'
        ? []
        : draft.options.map((o) => o.trim()).filter(Boolean)

    const payload = {
      text: draft.text.trim(),
      category: draft.category || 'custom',
      customContext:
        draft.category === 'custom' ? draft.customContext.trim() : '',
      type: draft.type,
      required: draft.type === 'short_text' ? false : draft.required,
      options: cleanedOptions,
    }

    if (editingId) {
      onChange((prev) =>
        prev.map((q) => (q.id === editingId ? { ...q, ...payload } : q)),
      )
    } else {
      onChange((prev) => [...prev, { id: `q-${Date.now()}`, ...payload }])
    }
    cancelForm()
  }

  const handleDelete = (id) => {
    onChange((prev) => prev.filter((q) => q.id !== id))
  }

  const handleMove = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    onChange((prev) => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const handleOptionChange = (idx, value) => {
    setDraft((prev) => {
      const next = [...prev.options]
      next[idx] = value
      return { ...prev, options: next }
    })
  }

  const addOptionField = () => {
    setDraft((prev) => ({ ...prev, options: [...prev.options, ''] }))
  }

  const removeOptionField = (idx) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx),
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Questionnaire
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            Configure questions and their semantic topics so generated reviews
            accurately reflect customer answers.
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button variant="primary" size="sm" onClick={startAdd}>
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form
          onSubmit={handleSave}
          className="bg-card rounded-lg border border-border p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              {editingId ? 'Edit Question' : 'New Question'}
            </h4>
            <button
              type="button"
              onClick={cancelForm}
              className="text-text-tertiary hover:text-text-primary cursor-pointer"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Input
            label="Question Text"
            placeholder="e.g. How was the staff behaviour?"
            value={draft.text}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, text: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-text-primary">
                  Semantic Topic
                </label>
                {suggestedLabel && !manualCategory && (
                  <span className="text-[11px] text-primary font-medium">
                    Auto-suggested
                  </span>
                )}
              </div>
              <select
                value={draft.category}
                onChange={(e) => {
                  setManualCategory(true)
                  setDraft((prev) => ({ ...prev, category: e.target.value }))
                }}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {SEMANTIC_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Question Type
              </label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {draft.category === 'custom' && (
            <Input
              label="Topic Description (Optional)"
              placeholder="e.g. parking availability, live music, kids play area"
              value={draft.customContext}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, customContext: e.target.value }))
              }
            />
          )}

          {draft.type !== 'short_text' && (
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.required}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span>Required question</span>
              </label>
            </div>
          )}

          {draft.type !== 'short_text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Answer Options
                </label>
                <button
                  type="button"
                  onClick={addOptionField}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-2">
                {draft.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                    />
                    {draft.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOptionField(idx)}
                        aria-label="Remove option"
                        className="p-2 text-text-tertiary hover:text-error cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={cancelForm}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingId ? 'Update Question' : 'Save Question'}
            </Button>
          </div>
        </form>
      )}

      {questions.length === 0 ? (
        <div className="bg-card rounded-lg border border-border">
          <EmptyState
            title="No questions configured"
            description="Add questions to guide customers through writing an authentic review."
            action={
              !isAdding && (
                <Button variant="primary" size="sm" onClick={startAdd}>
                  <Plus className="w-4 h-4" />
                  Add First Question
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-text-tertiary tabular-nums">
                    Q{index + 1}
                  </span>
                  <span className="text-xs font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-sm border border-border">
                    {TYPE_LABELS[q.type] || q.type}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-sm">
                    {CATEGORY_LABELS[q.category] || 'Custom'}
                  </span>
                  {q.required && (
                    <span className="text-xs text-text-tertiary">Required</span>
                  )}
                </div>
                <p className="text-sm font-medium text-text-primary">{q.text}</p>
                {q.options?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {q.options.map((opt, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-text-secondary bg-surface px-2.5 py-1 rounded-sm"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  aria-label="Move question up"
                  className="p-1.5 rounded-md border border-border bg-white text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === questions.length - 1}
                  aria-label="Move question down"
                  className="p-1.5 rounded-md border border-border bg-white text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(q)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-white text-text-primary hover:bg-surface cursor-pointer ml-1"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
                  aria-label="Delete question"
                  className="p-1.5 rounded-md border border-border bg-white text-text-tertiary hover:text-error cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

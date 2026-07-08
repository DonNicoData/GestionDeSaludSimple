import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { FormField } from '@/components/form/FormField'
import { Input } from '@/components/shared/Input'
import {
  metricsSchema,
  type MetricsField,
  type MetricsFormState,
  type MetricsOutput,
} from '@/lib/validation'
import type { Record as Measurement } from '@/types'
import type { CreateRecordInput } from '@/db/repo'

interface EditRecordModalProps {
  record: Measurement
  onClose: () => void
  onSaved: () => void
  updateRecord: (id: number, input: CreateRecordInput) => Promise<void>
}

const FIELD_RANGES: Record<MetricsField, { min: number; max: number; step: number }> = {
  weight: { min: 20, max: 300, step: 0.1 },
  bmi: { min: 10, max: 60, step: 0.1 },
  bodyFatPct: { min: 3, max: 50, step: 0.1 },
  muscleMassPct: { min: 10, max: 70, step: 0.1 },
  calories: { min: 800, max: 6000, step: 1 },
  bioAge: { min: 10, max: 100, step: 1 },
  visceralFat: { min: 1, max: 30, step: 1 },
}

const FIELD_KEYS: MetricsField[] = [
  'weight',
  'bmi',
  'bodyFatPct',
  'muscleMassPct',
  'calories',
  'bioAge',
  'visceralFat',
]

const NOTES_MAX = 500

export function EditRecordModal({
  record,
  onClose,
  onSaved,
  updateRecord,
}: EditRecordModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<MetricsFormState>({
    weight: String(record.weight),
    bmi: String(record.bmi),
    bodyFatPct: String(record.bodyFatPct),
    muscleMassPct: String(record.muscleMassPct),
    calories: String(record.calories),
    bioAge: String(record.bioAge),
    visceralFat: String(record.visceralFat),
  })
  const [notes, setNotes] = useState(record.notes ?? '')
  const [errors, setErrors] = useState<Partial<Record<MetricsField, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const updateField = (key: MetricsField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = metricsSchema.safeParse(form)
    if (!parsed.success) {
      const next: Partial<Record<MetricsField, string>> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as MetricsField
        if (path && !next[path]) {
          next[path] = issue.message
        }
      }
      setErrors(next)
      return
    }
    setSubmitting(true)
    try {
      await updateRecord(record.id as number, {
        ...(parsed.data as MetricsOutput),
        notes: notes.trim() || undefined,
      })
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-record-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-graphite/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-bone shadow-card p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-record-title" className="text-lg sm:text-xl font-bold text-graphite">
          {t('admin.detail.recordsTitle')}
        </h2>

        {FIELD_KEYS.map((key) => {
          const range = FIELD_RANGES[key]
          return (
            <FormField
              key={key}
              id={`er-${key}`}
              label={t(`metricsForm.fields.${key}.label`)}
              errorKey={errors[key] ?? null}
              required
            >
              <Input
                id={`er-${key}`}
                type="number"
                value={form[key]}
                onChange={(v) => updateField(key, v)}
                placeholder={t(`metricsForm.fields.${key}.placeholder`)}
                suffix={t(`metricsForm.fields.${key}.suffix`)}
                min={range.min}
                max={range.max}
                step={range.step}
                state={errors[key] ? 'error' : 'neutral'}
              />
            </FormField>
          )
        })}

        <FormField
          id="er-notes"
          label={t('metricsForm.notes.label')}
          help={t('metricsForm.notes.help')}
        >
          <textarea
            id="er-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
            maxLength={NOTES_MAX}
            rows={3}
            className="w-full px-4 py-3 text-base bg-white border-2 border-divider rounded-2xl focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone resize-y min-h-[80px]"
            placeholder={t('metricsForm.notes.placeholder')}
          />
          <p className="text-xs text-graphite/50 text-right mt-1">
            {notes.length}/{NOTES_MAX}
          </p>
        </FormField>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose} fullWidth>
            {t('admin.actions.cancel')}
          </Button>
          <Button type="submit" size="md" disabled={submitting} fullWidth>
            {submitting ? t('common.saving') : t('admin.actions.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}

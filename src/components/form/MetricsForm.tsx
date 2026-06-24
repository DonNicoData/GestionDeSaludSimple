import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/form/FormField'
import { Input, type InputState } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import {
  metricsSchema,
  validateMetricField,
  type MetricsField,
  type MetricsOutput,
} from '@/lib/validation'

type MetricsFormState = Record<MetricsField, string>

type ErrorState = Partial<Record<MetricsField, string>>
type TouchedState = Partial<Record<MetricsField, boolean>>

interface MetricsFormProps {
  onSubmit: (data: MetricsOutput) => void
  onBack?: () => void
}

// Rango visible para el usuario en errores "outOfRange"
const FIELD_RANGES: Record<MetricsField, { min: number; max: number; step: number }> = {
  weight: { min: 20, max: 300, step: 0.1 },
  bmi: { min: 0, max: 60, step: 0.1 },
  bodyFatPct: { min: 0, max: 50, step: 0.1 },
  muscleMassPct: { min: 0, max: 70, step: 0.1 },
  calories: { min: 800, max: 6000, step: 1 },
  bioAge: { min: 0, max: 100, step: 1 },
  visceralFat: { min: 1, max: 30, step: 1 },
}

const EMPTY_FORM: MetricsFormState = {
  weight: '',
  bmi: '',
  bodyFatPct: '',
  muscleMassPct: '',
  calories: '',
  bioAge: '',
  visceralFat: '',
}

export function MetricsForm({ onSubmit, onBack }: MetricsFormProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<MetricsFormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<ErrorState>({})
  const [touched, setTouched] = useState<TouchedState>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const computeState = (field: MetricsField): InputState => {
    if (!touched[field] && !submitAttempted) return 'neutral'
    return errors[field] ? 'error' : 'valid'
  }

  const updateField = (key: MetricsField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (touched[key] || submitAttempted) {
      const errorKey = validateMetricField(key, value)
      setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
    }
  }

  const handleBlur = (key: MetricsField) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const errorKey = validateMetricField(key, form[key])
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    setShowSummary(true)

    const allTouched: TouchedState = {
      weight: true,
      bmi: true,
      bodyFatPct: true,
      muscleMassPct: true,
      calories: true,
      bioAge: true,
      visceralFat: true,
    }
    setTouched(allTouched)

    const parsed = metricsSchema.safeParse({
      weight: form.weight,
      bmi: form.bmi,
      bodyFatPct: form.bodyFatPct,
      muscleMassPct: form.muscleMassPct,
      calories: form.calories,
      bioAge: form.bioAge,
      visceralFat: form.visceralFat,
    })

    if (!parsed.success) {
      const next: ErrorState = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as MetricsField
        if (path && !next[path]) {
          next[path] = issue.message
        }
      }
      setErrors(next)

      const firstErrorField = Object.keys(next)[0]
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField)
        el?.focus()
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setErrors({})
    setShowSummary(false)
    onSubmit(parsed.data)
  }

  const fieldKeys: MetricsField[] = [
    'weight',
    'bmi',
    'bodyFatPct',
    'muscleMassPct',
    'calories',
    'bioAge',
    'visceralFat',
  ]

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7"
      aria-label={t('metricsForm.title')}
    >
      {showSummary && Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border-2 border-alert bg-alert/10 p-4"
        >
          <p className="font-semibold text-alert">{t('metricsForm.summary.title')}</p>
          <p className="text-sm text-graphite/80 mt-1 leading-relaxed">
            {t('metricsForm.summary.body')}
          </p>
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
          {t('metricsForm.title')}
        </h1>
        <p className="text-sm sm:text-base text-graphite/70 leading-relaxed">
          {t('metricsForm.subtitle')}
        </p>
      </header>

      {fieldKeys.map((key) => {
        const range = FIELD_RANGES[key]
        const isOptional = range.min === 0
        return (
          <FormField
            key={key}
            id={key}
            label={t(`metricsForm.fields.${key}.label`)}
            help={t(`metricsForm.fields.${key}.help`)}
            errorKey={errors[key] ?? null}
            required={!isOptional}
          >
            <Input
              id={key}
              type="number"
              inputMode="decimal"
              value={form[key]}
              onChange={(v) => updateField(key, v)}
              onBlur={() => handleBlur(key)}
              placeholder={t(`metricsForm.fields.${key}.placeholder`)}
              suffix={t(`metricsForm.fields.${key}.suffix`)}
              min={range.min}
              max={range.max}
              step={range.step}
              state={computeState(key)}
            />
          </FormField>
        )
      })}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onBack && (
          <Button type="button" variant="outline" size="lg" onClick={onBack} fullWidth>
            {t('metricsForm.buttons.back')}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth>
          {t('metricsForm.buttons.continue')}
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  )
}

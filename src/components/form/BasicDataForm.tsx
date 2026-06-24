import { ClipboardEvent, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/form/FormField'
import { GenderField } from '@/components/form/SegmentedControl'
import { RadioGroup } from '@/components/form/RadioGroup'
import { Input, type InputState } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import {
  basicDataSchema,
  validateField,
  type BasicDataOutput,
} from '@/lib/validation'
import { calculateAge, todayIso } from '@/lib/age'
import { combineName, normalizeName } from '@/lib/name'
import type { Gender, WristContexture } from '@/types'

interface BasicDataFormProps {
  onSubmit: (data: BasicDataOutput & { age: number; fullName: string }) => void
  onBack?: () => void
}

interface FormState {
  firstName: string
  lastName1: string
  lastName2: string
  birthDate: string
  heightCm: string
  gender: Gender | undefined
  wristContexture: WristContexture | undefined
}

type ErrorState = Partial<Record<keyof FormState, string>>
type TouchedState = Partial<Record<keyof FormState, boolean>>

const NAME_FIELDS_MAX = 50

export function BasicDataForm({ onSubmit, onBack }: BasicDataFormProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName1: '',
    lastName2: '',
    birthDate: '',
    heightCm: '',
    gender: undefined,
    wristContexture: undefined,
  })

  const [errors, setErrors] = useState<ErrorState>({})
  const [touched, setTouched] = useState<TouchedState>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const age = useMemo(() => calculateAge(form.birthDate), [form.birthDate])

  const formRef = useRef<HTMLDivElement>(null)

  const computeState = (field: keyof FormState): InputState => {
    if (!touched[field] && !submitAttempted) return 'neutral'
    return errors[field] ? 'error' : 'valid'
  }

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (touched[key] || submitAttempted) {
      const errorKey = validateField(key, value)
      setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
    }
  }

  const handleBlur = <K extends keyof FormState>(key: K) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const errorKey = validateField(key, form[key])
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
  }

  /**
   * Para campos de selección (radio, segmented).
   * Actualiza form + touched + errors atómicamente con el NUEVO valor,
   * evitando el bug de stale closure que ocurre al llamar updateField +
   * handleBlur por separado en el mismo evento (el closure quedaba con
   * el valor anterior y la validación fallaba falsamente).
   */
  const selectField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setTouched((prev) => ({ ...prev, [key]: true }))
    const errorKey = validateField(key, value)
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
  }

  const handlePasteClean = (
    e: ClipboardEvent<HTMLInputElement>,
    key: 'firstName' | 'lastName1' | 'lastName2',
  ) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const cleaned = pasted.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
    const inputEl = e.currentTarget
    const start = inputEl.selectionStart ?? form[key].length
    const end = inputEl.selectionEnd ?? start
    const current = form[key]
    const next = (current.slice(0, start) + cleaned + current.slice(end)).slice(0, NAME_FIELDS_MAX)
    updateField(key, next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)
    setShowSummary(true)

    const allTouched: TouchedState = {
      firstName: true,
      lastName1: true,
      lastName2: true,
      birthDate: true,
      heightCm: true,
      gender: true,
      wristContexture: true,
    }
    setTouched(allTouched)

    const parsed = basicDataSchema.safeParse({
      firstName: form.firstName,
      lastName1: form.lastName1,
      lastName2: form.lastName2,
      birthDate: form.birthDate,
      heightCm: form.heightCm,
      gender: form.gender,
      wristContexture: form.wristContexture,
    })

    if (!parsed.success) {
      const next: ErrorState = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as keyof FormState
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
    onSubmit({
      ...parsed.data,
      age,
      fullName: combineName(parsed.data.firstName, parsed.data.lastName1, parsed.data.lastName2),
    })
  }

  const wristOptions = [
    { value: 'thin' as const, label: t('basicForm.fields.wristContexture.options.thin') },
    { value: 'normal' as const, label: t('basicForm.fields.wristContexture.options.normal') },
    { value: 'thick' as const, label: t('basicForm.fields.wristContexture.options.thick') },
  ]

  const nameFieldProps = (key: 'firstName' | 'lastName1' | 'lastName2') => ({
    id: key,
    type: 'text' as const,
    autoComplete:
      key === 'firstName' ? 'given-name' : key === 'lastName1' ? 'family-name' : 'additional-name',
    value: form[key],
    onChange: (v: string) => updateField(key, v),
    onBlur: () => handleBlur(key),
    onPaste: (e: ClipboardEvent<HTMLInputElement>) => handlePasteClean(e, key),
    placeholder: t(`basicForm.fields.${key}.placeholder`),
    maxLength: NAME_FIELDS_MAX,
    state: computeState(key),
  })

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7"
      aria-label={t('basicForm.title')}
    >
      <div ref={formRef}>
        {showSummary && Object.keys(errors).length > 0 && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-2 rounded-2xl border-2 border-alert bg-alert/10 p-4"
          >
            <p className="font-semibold text-alert">{t('basicForm.summary.title')}</p>
            <p className="text-sm text-graphite/80 mt-1 leading-relaxed">
              {t('basicForm.summary.body')}
            </p>
          </div>
        )}

        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
            {t('basicForm.title')}
          </h1>
          <p className="text-sm sm:text-base text-graphite/70 leading-relaxed">
            {t('basicForm.subtitle')}
          </p>
        </header>
      </div>

      <FormField
        id="firstName"
        label={t('basicForm.fields.firstName.label')}
        help={t('basicForm.fields.firstName.help')}
        errorKey={errors.firstName ?? null}
        required
        showCounter
        counter={{ current: form.firstName.length, max: NAME_FIELDS_MAX }}
      >
        <Input {...nameFieldProps('firstName')} />
      </FormField>

      <FormField
        id="lastName1"
        label={t('basicForm.fields.lastName1.label')}
        help={t('basicForm.fields.lastName1.help')}
        errorKey={errors.lastName1 ?? null}
        required
        showCounter
        counter={{ current: form.lastName1.length, max: NAME_FIELDS_MAX }}
      >
        <Input {...nameFieldProps('lastName1')} />
      </FormField>

      <FormField
        id="lastName2"
        label={t('basicForm.fields.lastName2.label')}
        help={t('basicForm.fields.lastName2.help')}
        errorKey={errors.lastName2 ?? null}
        required
        showCounter
        counter={{ current: form.lastName2.length, max: NAME_FIELDS_MAX }}
      >
        <Input {...nameFieldProps('lastName2')} />
      </FormField>

      <FormField
        id="birthDate"
        label={t('basicForm.fields.birthDate.label')}
        help={t('basicForm.fields.birthDate.help')}
        errorKey={errors.birthDate ?? null}
        required
      >
        <Input
          id="birthDate"
          type="date"
          value={form.birthDate}
          onChange={(v) => updateField('birthDate', v)}
          onBlur={() => handleBlur('birthDate')}
          max={todayIso()}
          state={computeState('birthDate')}
        />
      </FormField>

      <FormField
        id="age"
        label={t('basicForm.fields.age.label')}
        help={t('basicForm.fields.age.help')}
      >
        <div
          id="age"
          aria-live="polite"
          className="h-12 px-4 flex items-center bg-divider rounded-2xl text-graphite/60 text-base"
        >
          {form.birthDate && age > 0
            ? t('basicForm.fields.age.autoCalculated', { years: age })
            : '—'}
        </div>
      </FormField>

      <FormField
        id="heightCm"
        label={t('basicForm.fields.heightCm.label')}
        help={t('basicForm.fields.heightCm.help')}
        errorKey={errors.heightCm ?? null}
        required
      >
        <Input
          id="heightCm"
          type="number"
          inputMode="numeric"
          value={form.heightCm}
          onChange={(v) => updateField('heightCm', v)}
          onBlur={() => handleBlur('heightCm')}
          placeholder={t('basicForm.fields.heightCm.placeholder')}
          suffix={t('basicForm.fields.heightCm.suffix')}
          min={100}
          max={230}
          step={1}
          state={computeState('heightCm')}
        />
      </FormField>

      <FormField
        id="gender"
        label={t('basicForm.fields.gender.label')}
        errorKey={errors.gender ?? null}
        required
      >
        <GenderField
          value={form.gender}
          onChange={(v) => selectField('gender', v)}
          error={Boolean(errors.gender)}
        />
      </FormField>

      <FormField
        id="wristContexture"
        label={t('basicForm.fields.wristContexture.label')}
        help={t('basicForm.fields.wristContexture.help')}
        errorKey={errors.wristContexture ?? null}
        required
      >
        <RadioGroup<WristContexture>
          name="wristContexture"
          options={wristOptions}
          value={form.wristContexture}
          onChange={(v) => selectField('wristContexture', v)}
          ariaLabel={t('basicForm.fields.wristContexture.label')}
          error={Boolean(errors.wristContexture)}
        />
      </FormField>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onBack && (
          <Button type="button" variant="outline" size="lg" onClick={onBack} fullWidth>
            {t('basicForm.buttons.back')}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth>
          {t('basicForm.buttons.continue')}
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

      <input
        type="hidden"
        value={normalizeName(
          combineName(form.firstName, form.lastName1, form.lastName2),
        )}
        readOnly
        aria-hidden
      />
    </form>
  )
}

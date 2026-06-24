import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/form/FormField'
import { GenderField } from '@/components/form/SegmentedControl'
import { RadioGroup } from '@/components/form/RadioGroup'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import {
  basicDataSchema,
  normalizeName,
  validateField,
  type BasicDataInput,
} from '@/lib/validation'
import { calculateAge, todayIso } from '@/lib/age'
import type { Gender, WristContexture } from '@/types'

interface BasicDataFormProps {
  onSubmit: (data: BasicDataInput & { age: number }) => void
  onBack?: () => void
}

interface FormState {
  name: string
  birthDate: string
  heightCm: string
  gender: Gender | undefined
  wristContexture: WristContexture | undefined
}

type ErrorState = Partial<Record<keyof FormState, string>>

export function BasicDataForm({ onSubmit, onBack }: BasicDataFormProps) {
  const { t } = useTranslation()

  const [form, setForm] = useState<FormState>({
    name: '',
    birthDate: '',
    heightCm: '',
    gender: undefined,
    wristContexture: undefined,
  })

  const [errors, setErrors] = useState<ErrorState>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const age = useMemo(() => calculateAge(form.birthDate), [form.birthDate])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (submitAttempted) {
      const errorKey = validateField(key as keyof BasicDataInput, value as never)
      setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    const parsed = basicDataSchema.safeParse({
      name: form.name,
      birthDate: form.birthDate,
      heightCm: form.heightCm === '' ? undefined : Number(form.heightCm),
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
        document
          .getElementById(firstErrorField)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setErrors({})
    onSubmit({ ...parsed.data, age })
  }

  const wristOptions = [
    { value: 'thin' as const, label: t('basicForm.fields.wristContexture.options.thin') },
    { value: 'normal' as const, label: t('basicForm.fields.wristContexture.options.normal') },
    { value: 'thick' as const, label: t('basicForm.fields.wristContexture.options.thick') },
  ]

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7"
      aria-label={t('basicForm.title')}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
          {t('basicForm.title')}
        </h1>
        <p className="text-sm sm:text-base text-graphite/70 leading-relaxed">
          {t('basicForm.subtitle')}
        </p>
      </header>

      <FormField
        id="name"
        label={t('basicForm.fields.name.label')}
        help={t('basicForm.fields.name.help')}
        errorKey={errors.name ?? null}
        required
      >
        <Input
          id="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(v) => update('name', v)}
          placeholder={t('basicForm.fields.name.placeholder')}
          maxLength={100}
          error={Boolean(errors.name)}
        />
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
          onChange={(v) => update('birthDate', v)}
          max={todayIso()}
          error={Boolean(errors.birthDate)}
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
          onChange={(v) => update('heightCm', v)}
          placeholder={t('basicForm.fields.heightCm.placeholder')}
          suffix={t('basicForm.fields.heightCm.suffix')}
          min={100}
          max={230}
          step={1}
          error={Boolean(errors.heightCm)}
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
          onChange={(v) => update('gender', v)}
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
          onChange={(v) => update('wristContexture', v)}
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

      <input type="hidden" value={normalizeName(form.name)} readOnly aria-hidden />
    </form>
  )
}

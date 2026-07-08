import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { FormField } from '@/components/form/FormField'
import { Input } from '@/components/shared/Input'
import { GenderField, SegmentedControl } from '@/components/form/SegmentedControl'
import { calculateAge, todayIso } from '@/lib/age'
import { fullNameOf } from '@/lib/name'
import {
  basicDataSchema,
  validateField,
  type BasicDataOutput,
} from '@/lib/validation'
import type { Client, Gender, WristContexture } from '@/types'
import type { CreateClientInput } from '@/db/repo'

interface EditClientModalProps {
  client: Client
  onClose: () => void
  onSaved: () => void
  updateClient: (
    id: number,
    input: Omit<CreateClientInput, 'age'>,
  ) => Promise<void>
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

/**
 * Modal de edición del cliente. Reusa los mismos Field components que
 * BasicDataForm para mantener consistencia visual, pero con submit
 * directo (no hay matching porque ya es edición de un cliente
 * existente, no creación).
 */
export function EditClientModal({
  client,
  onClose,
  onSaved,
  updateClient,
}: EditClientModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>({
    firstName: client.firstName,
    lastName1: client.lastName1,
    lastName2: client.lastName2,
    birthDate: client.birthDate,
    heightCm: String(client.heightCm),
    gender: client.gender,
    wristContexture: client.wristContexture,
  })
  const [errors, setErrors] = useState<ErrorState>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    const errorKey = validateField(key, value)
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      return
    }
    setSubmitting(true)
    try {
      await updateClient(client.id as number, parsed.data as Omit<BasicDataOutput, 'age'>)
      onSaved()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-client-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-graphite/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-bone shadow-card p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-client-title" className="text-lg sm:text-xl font-bold text-graphite">
          {t('admin.detail.editClient')} — {fullNameOf(client)}
        </h2>

        <FormField
          id="ec-firstName"
          label={t('basicForm.fields.firstName.label')}
          errorKey={errors.firstName ?? null}
          required
        >
          <Input
            id="ec-firstName"
            type="text"
            value={form.firstName}
            onChange={(v) => updateField('firstName', v)}
            placeholder={t('basicForm.fields.firstName.placeholder')}
            state={errors.firstName ? 'error' : 'neutral'}
            autoComplete="given-name"
          />
        </FormField>

        <FormField
          id="ec-lastName1"
          label={t('basicForm.fields.lastName1.label')}
          errorKey={errors.lastName1 ?? null}
          required
        >
          <Input
            id="ec-lastName1"
            type="text"
            value={form.lastName1}
            onChange={(v) => updateField('lastName1', v)}
            placeholder={t('basicForm.fields.lastName1.placeholder')}
            state={errors.lastName1 ? 'error' : 'neutral'}
            autoComplete="family-name"
          />
        </FormField>

        <FormField
          id="ec-lastName2"
          label={t('basicForm.fields.lastName2.label')}
          errorKey={errors.lastName2 ?? null}
          required
        >
          <Input
            id="ec-lastName2"
            type="text"
            value={form.lastName2}
            onChange={(v) => updateField('lastName2', v)}
            placeholder={t('basicForm.fields.lastName2.placeholder')}
            state={errors.lastName2 ? 'error' : 'neutral'}
            autoComplete="additional-name"
          />
        </FormField>

        <FormField
          id="ec-birthDate"
          label={t('basicForm.fields.birthDate.label')}
          errorKey={errors.birthDate ?? null}
          required
        >
          <Input
            id="ec-birthDate"
            type="date"
            value={form.birthDate}
            onChange={(v) => updateField('birthDate', v)}
            max={todayIso()}
            state={errors.birthDate ? 'error' : 'neutral'}
          />
        </FormField>

        <FormField
          id="ec-heightCm"
          label={t('basicForm.fields.heightCm.label')}
          errorKey={errors.heightCm ?? null}
          required
        >
          <Input
            id="ec-heightCm"
            type="number"
            value={form.heightCm}
            onChange={(v) => updateField('heightCm', v)}
            placeholder={t('basicForm.fields.heightCm.placeholder')}
            suffix={t('basicForm.fields.heightCm.suffix')}
            min={100}
            max={230}
            step={1}
            state={errors.heightCm ? 'error' : 'neutral'}
          />
        </FormField>

        <FormField
          id="ec-gender"
          label={t('basicForm.fields.gender.label')}
          errorKey={errors.gender ?? null}
          required
        >
          <GenderField
            value={form.gender}
            onChange={(v) => updateField('gender', v)}
            error={Boolean(errors.gender)}
          />
        </FormField>

        <FormField
          id="ec-wrist"
          label={t('basicForm.fields.wristContexture.label')}
          errorKey={errors.wristContexture ?? null}
          required
        >
          <SegmentedControl<WristContexture>
            name="ec-wrist"
            value={form.wristContexture}
            onChange={(v) => updateField('wristContexture', v)}
            ariaLabel={t('basicForm.fields.wristContexture.label')}
            error={Boolean(errors.wristContexture)}
            options={[
              { value: 'thin', label: t('basicForm.fields.wristContexture.options.thin') },
              { value: 'normal', label: t('basicForm.fields.wristContexture.options.normal') },
              { value: 'thick', label: t('basicForm.fields.wristContexture.options.thick') },
            ]}
          />
        </FormField>

        <p className="text-xs text-graphite/60">
          {t('basicForm.fields.age.autoCalculated', {
            years: calculateAge(form.birthDate),
          })}
        </p>

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

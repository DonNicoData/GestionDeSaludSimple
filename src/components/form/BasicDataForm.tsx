import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/form/FormField'
import { GenderField, SegmentedControl } from '@/components/form/SegmentedControl'
import { Input, type InputState } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import {
  basicDataSchema,
  validateField,
  type BasicDataOutput,
} from '@/lib/validation'
import { calculateAge, todayIso } from '@/lib/age'
import { combineName, normalizeName } from '@/lib/name'
import { useFormDraftDB } from '@/hooks/useFormDraftDB'
import { findClientMatch, type ClientMatch } from '@/db/repo'
import wristThinUrl from '/images/wrist-thin.svg?url'
import wristNormalUrl from '/images/wrist-normal.svg?url'
import wristThickUrl from '/images/wrist-thick.svg?url'
import type { Client, Gender, WristContexture } from '@/types'

interface BasicDataFormProps {
  onSubmit: (
    data: BasicDataOutput & {
      age: number
      fullName: string
      clientId?: number
    },
  ) => void
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

/**
 * Estado de la pantalla de coincidencia tras submit válido.
 * - 'idle':    sin chequear todavía
 * - 'loading': buscando en DB
 * - 'high':    match exacto → reutilizamos el cliente
 * - 'partial': 1 candidato parcial → "¿eres tú?"
 * - 'none':    cliente nuevo → se crea al confirmar
 */
type MatchPhase =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'high'; client: Client }
  | { kind: 'partial'; candidates: Client[] }
  | { kind: 'none' }

const NAME_FIELDS_MAX = 50

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName1: '',
  lastName2: '',
  birthDate: '',
  heightCm: '',
  gender: undefined,
  wristContexture: undefined,
}

const DRAFT_KEY = 'salud_draft_basic_v1'

export function BasicDataForm({ onSubmit, onBack }: BasicDataFormProps) {
  const { t } = useTranslation()
  const draft = useFormDraftDB<FormState>(DRAFT_KEY)

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [hydrated, setHydrated] = useState(false)
  const [errors, setErrors] = useState<ErrorState>({})
  const [touched, setTouched] = useState<TouchedState>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [matchPhase, setMatchPhase] = useState<MatchPhase>({ kind: 'idle' })

  useEffect(() => {
    if (!draft.loading && !hydrated) {
      if (draft.value) setForm(draft.value)
      setHydrated(true)
    }
  }, [draft.loading, draft.value, hydrated])

  const age = useMemo(() => calculateAge(form.birthDate), [form.birthDate])

  const computeState = (field: keyof FormState): InputState => {
    if (!touched[field] && !submitAttempted) return 'neutral'
    return errors[field] ? 'error' : 'valid'
  }

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      draft.setValue(next)
      return next
    })
    if (touched[key] || submitAttempted) {
      const errorKey = validateField(key, value)
      setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
    }
    // Cualquier edición después de submit invalida la fase de matching.
    if (matchPhase.kind !== 'idle') setMatchPhase({ kind: 'idle' })
  }

  const handleBlur = <K extends keyof FormState>(key: K) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
    const errorKey = validateField(key, form[key])
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
  }

  const selectField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      draft.setValue(next)
      return next
    })
    setTouched((prev) => ({ ...prev, [key]: true }))
    const errorKey = validateField(key, value)
    setErrors((prev) => ({ ...prev, [key]: errorKey ?? undefined }))
    if (matchPhase.kind !== 'idle') setMatchPhase({ kind: 'idle' })
  }

  const buildParsedPayload = () => {
    const parsed = basicDataSchema.safeParse({
      firstName: form.firstName,
      lastName1: form.lastName1,
      lastName2: form.lastName2,
      birthDate: form.birthDate,
      heightCm: form.heightCm,
      gender: form.gender,
      wristContexture: form.wristContexture,
    })
    if (!parsed.success) return null
    return {
      ...parsed.data,
      age,
      fullName: combineName(parsed.data.firstName, parsed.data.lastName1, parsed.data.lastName2),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

    const payload = buildParsedPayload()
    if (!payload) {
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
      }
      return
    }

    setErrors({})
    setShowSummary(false)
    setMatchPhase({ kind: 'loading' })

    const match: ClientMatch = await findClientMatch({
      firstName: payload.firstName,
      lastName1: payload.lastName1,
      lastName2: payload.lastName2,
      birthDate: payload.birthDate,
      age: payload.age,
      gender: payload.gender,
      heightCm: payload.heightCm,
      wristContexture: payload.wristContexture,
    })

    if (match.level === 'high' && match.client) {
      setMatchPhase({ kind: 'high', client: match.client })
      return
    }
    if (match.level === 'partial' && match.candidates && match.candidates.length > 0) {
      setMatchPhase({ kind: 'partial', candidates: match.candidates })
      return
    }
    // No match: cliente nuevo, avanzamos directamente con clientId undefined.
    onSubmit(payload)
  }

  const confirmHighMatch = () => {
    if (matchPhase.kind !== 'high') return
    const payload = buildParsedPayload()
    if (!payload) return
    onSubmit({ ...payload, clientId: matchPhase.client.id })
  }

  const confirmPartialAsSame = (client: Client) => {
    const payload = buildParsedPayload()
    if (!payload) return
    onSubmit({ ...payload, clientId: client.id })
  }

  const confirmPartialAsNew = () => {
    const payload = buildParsedPayload()
    if (!payload) return
    onSubmit(payload)
  }

  const isMatchPhase = matchPhase.kind !== 'idle' && matchPhase.kind !== 'loading'
  const wristOptions = [
    {
      value: 'thin' as const,
      label: t('basicForm.fields.wristContexture.options.thin'),
      description: t('basicForm.fields.wristContexture.descriptions.thin'),
      icon: (
        <img
          src={wristThinUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ),
    },
    {
      value: 'normal' as const,
      label: t('basicForm.fields.wristContexture.options.normal'),
      description: t('basicForm.fields.wristContexture.descriptions.normal'),
      icon: (
        <img
          src={wristNormalUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ),
    },
    {
      value: 'thick' as const,
      label: t('basicForm.fields.wristContexture.options.thick'),
      description: t('basicForm.fields.wristContexture.descriptions.thick'),
      icon: (
        <img
          src={wristThickUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ),
    },
  ]

  const nameFieldProps = (key: 'firstName' | 'lastName1' | 'lastName2') => ({
    id: key,
    type: 'text' as const,
    autoComplete:
      key === 'firstName' ? 'given-name' : key === 'lastName1' ? 'family-name' : 'additional-name',
    value: form[key],
    onChange: (v: string) => updateField(key, v),
    onBlur: () => handleBlur(key),
    placeholder: t(`basicForm.fields.${key}.placeholder`),
    maxLength: NAME_FIELDS_MAX,
    state: computeState(key),
  })

  // P1-6: mientras el draft se está hidratando desde IndexedDB por primera
  // vez en esta sesión de montaje, mostramos un skeleton en lugar del
  // form vacío. Una vez "hydrated" (incluso si el draft era null), el
  // form real se renderiza para evitar parpadeo en navegaciones internas.
  if (draft.loading && !hydrated) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="flex flex-col gap-5"
      >
        <div className="h-8 w-48 bg-divider rounded-2xl animate-pulse" />
        <div className="h-3 w-full bg-divider rounded-full animate-pulse" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-12 bg-divider/60 rounded-2xl animate-pulse"
          />
        ))}
      </section>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7"
      aria-label={t('basicForm.title')}
    >
      {showSummary && Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border-2 border-alert bg-alert/10 p-4"
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
          inputMode="decimal"
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
        errorKey={errors.wristContexture ?? null}
        required
      >
        <p className="text-sm text-graphite/70 -mt-1 mb-2 leading-relaxed">
          {t('basicForm.fields.wristContexture.intro')}
        </p>
        <SegmentedControl<WristContexture>
          name="wristContexture"
          options={wristOptions}
          value={form.wristContexture}
          onChange={(v) => selectField('wristContexture', v)}
          ariaLabel={t('basicForm.fields.wristContexture.label')}
          error={Boolean(errors.wristContexture)}
        />
      </FormField>

      {matchPhase.kind === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-primary-soft bg-primary-soft/30 p-4 text-sm text-graphite/70"
        >
          {t('common.loading')}
        </div>
      )}

      {matchPhase.kind === 'high' && (
        <MatchBanner
          tone="success"
          title={t('basicForm.match.high.title')}
          body={t('basicForm.match.high.body', {
            name: fullNameOf(matchPhase.client),
            records: 0,
          })}
          primaryLabel={t('basicForm.match.high.confirm')}
          onPrimary={confirmHighMatch}
        />
      )}

      {matchPhase.kind === 'partial' && (
        <PartialMatchPanel
          candidates={matchPhase.candidates}
          onConfirm={confirmPartialAsSame}
          onDecline={confirmPartialAsNew}
        />
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        {onBack && (
          <Button type="button" variant="outline" size="lg" onClick={onBack} fullWidth>
            {t('basicForm.buttons.back')}
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={matchPhase.kind === 'loading' || isMatchPhase}
        >
          {matchPhase.kind === 'loading'
            ? t('common.loading')
            : t('basicForm.buttons.continue')}
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

interface MatchBannerProps {
  tone: 'success' | 'warning'
  title: string
  body: string
  primaryLabel: string
  onPrimary: () => void
}

function MatchBanner({ tone, title, body, primaryLabel, onPrimary }: MatchBannerProps) {
  const styles =
    tone === 'success'
      ? 'border-primary-soft bg-primary-soft/30'
      : 'border-warning bg-warning/10'
  return (
    <div role="status" className={`rounded-2xl border p-5 ${styles}`}>
      <p className="font-semibold text-graphite mb-1">{title}</p>
      <p className="text-sm text-graphite/70 leading-relaxed mb-4">{body}</p>
      <Button size="md" onClick={onPrimary} fullWidth>
        {primaryLabel}
      </Button>
    </div>
  )
}

interface PartialMatchPanelProps {
  candidates: Client[]
  onConfirm: (client: Client) => void
  onDecline: () => void
}

function PartialMatchPanel({ candidates, onConfirm, onDecline }: PartialMatchPanelProps) {
  const { t } = useTranslation()
  const first = candidates[0]
  if (!first) return null
  return (
    <div
      role="status"
      className="rounded-2xl border border-warning bg-warning/10 p-5"
    >
      <p className="font-semibold text-graphite mb-1">
        {t('basicForm.match.partial.title')}
      </p>
      <p className="text-sm text-graphite/70 leading-relaxed mb-3">
        {t('basicForm.match.partial.body', { name: fullNameOf(first) })}
      </p>
      <ul className="flex flex-col gap-2 mb-4">
        {candidates.map((c) => (
          <li
            key={c.id}
            className="rounded-xl bg-white border border-divider p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-graphite truncate">
                {fullNameOf(c)}
              </p>
              <p className="text-xs text-graphite/60">
                {t('basicForm.match.partial.bornOn', { date: c.birthDate })}
                {c.heightCm != null ? ` · ${c.heightCm} cm` : ''}
              </p>
            </div>
            <Button size="sm" onClick={() => onConfirm(c)}>
              {t('basicForm.match.partial.yes')}
            </Button>
          </li>
        ))}
      </ul>
      <Button size="md" variant="outline" onClick={onDecline} fullWidth>
        {t('basicForm.match.partial.no')}
      </Button>
    </div>
  )
}

function fullNameOf(client: Client): string {
  return combineName(client.firstName, client.lastName1, client.lastName2)
}

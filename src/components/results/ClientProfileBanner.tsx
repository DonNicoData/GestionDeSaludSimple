import { useTranslation } from 'react-i18next'
import type { Client } from '@/types'
import { basalMetabolicRate, idealWeightKg } from '@/lib/evaluator'

interface ClientProfileBannerProps {
  client: Client
  currentWeight: number
}

/**
 * Banner siempre visible arriba de la pantalla de resultados.
 * Muestra los valores derivados del cliente que el evaluador usa para
 * contextualizar los resultados:
 *
 *  - Contextura de muñeca (etiqueta traducida)
 *  - Peso ideal estimado (Lorentz × factor de contextura)
 *  - TMB (Mifflin-St Jeor)
 *
 * El objetivo es que el usuario entienda que el peso se evaluó contra
 * un ideal AJUSTADO por su contextura, no contra un valor universal.
 */
export function ClientProfileBanner({
  client,
  currentWeight,
}: ClientProfileBannerProps) {
  const { t } = useTranslation()
  const ideal = idealWeightKg(client)
  const tmb = basalMetabolicRate(client, currentWeight)
  const diff = ideal ? ((currentWeight - ideal) / ideal) * 100 : 0

  const contextureKey = client.wristContexture
  const contextureLabel = t(`basicForm.fields.wristContexture.options.${contextureKey}`)

  return (
    <section
      aria-label={t('results.profile.title')}
      className="rounded-2xl border-2 border-primary-soft bg-primary-soft/20 p-4 sm:p-5 mb-6"
    >
      <header className="flex items-center gap-2 mb-3">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 text-primary-dark"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <h2 className="text-sm font-semibold text-graphite">
          {t('results.profile.title')}
        </h2>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <ProfileItem
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v20" />
              <path d="M8 6c0 2 1 3 4 3s4-1 4-3" />
              <path d="M8 18c0-2 1-3 4-3s4 1 4 3" />
            </svg>
          }
          label={t('results.profile.contexture')}
          value={contextureLabel}
          hint={t('results.profile.contextureHint')}
        />

        <ProfileItem
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6.5 6.5h11" />
              <path d="M6.5 17.5h11" />
              <path d="M3 10h18" />
              <path d="M3 14h18" />
            </svg>
          }
          label={t('results.profile.idealWeight')}
          value={`${ideal.toFixed(1)} kg`}
          hint={t('results.profile.idealWeightHint', {
            diff: diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
          })}
          valueTone={
            Math.abs(diff) <= 10
              ? 'normal'
              : Math.abs(diff) <= 20
                ? 'warning'
                : 'alert'
          }
        />

        <ProfileItem
          icon={
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          }
          label={t('results.profile.bmr')}
          value={`${Math.round(tmb)} kcal`}
          hint={t('results.profile.bmrHint')}
        />
      </div>
    </section>
  )
}

interface ProfileItemProps {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  valueTone?: 'normal' | 'warning' | 'alert'
}

function ProfileItem({
  icon,
  label,
  value,
  hint,
  valueTone,
}: ProfileItemProps) {
  const toneClasses: Record<NonNullable<ProfileItemProps['valueTone']>, string> = {
    normal: 'text-primary-dark',
    warning: 'text-graphite',
    alert: 'text-alert',
  }
  return (
    <div className="bg-white/60 rounded-2xl p-3">
      <div className="flex items-center gap-1.5 text-graphite/70 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div
        className={[
          'text-lg sm:text-xl font-bold tabular-nums',
          valueTone ? toneClasses[valueTone] : 'text-graphite',
        ].join(' ')}
      >
        {value}
      </div>
      <p className="text-xs text-graphite/60 mt-0.5 leading-relaxed">{hint}</p>
    </div>
  )
}
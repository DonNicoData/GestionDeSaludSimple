import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'

interface HomePageProps {
  onRegister: () => void
  hasDraft?: boolean
  onStartNew?: () => void
  lastVisitDays?: number | null
  knownClientName?: string
  onViewHistory?: () => void
}

export function HomePage({
  onRegister,
  hasDraft = false,
  onStartNew,
  lastVisitDays = null,
  knownClientName,
  onViewHistory,
}: HomePageProps) {
  const { t } = useTranslation()

  const greetingKey =
    lastVisitDays === null
      ? 'home.welcomeFirst'
      : lastVisitDays === 0
        ? 'home.welcomeReturningToday'
        : 'home.welcomeReturning'

  const greeting = t(greetingKey, lastVisitDays !== null && lastVisitDays > 0 ? { days: lastVisitDays } : {})

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
        <svg
          viewBox="0 0 24 24"
          className="h-10 w-10 text-primary-dark"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      <p className="text-graphite/80 text-base sm:text-lg leading-relaxed max-w-xl mb-2">
        {greeting}
      </p>

      {knownClientName && lastVisitDays !== null && (
        <p className="text-sm text-graphite/60 mb-6">
          {t('home.welcomeNamed', { name: knownClientName })}
        </p>
      )}

      {hasDraft ? (
        <div
          role="status"
          className="w-full max-w-xl mb-6 rounded-2xl border border-primary-soft bg-primary-soft/30 p-5 text-left"
        >
          <p className="font-semibold text-graphite mb-1">
            {t('home.hasDraft.title')}
          </p>
          <p className="text-sm text-graphite/70 leading-relaxed mb-4">
            {t('home.hasDraft.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="md" onClick={onRegister} fullWidth>
              {t('home.hasDraft.continue')}
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
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
            <Button size="md" variant="outline" onClick={onStartNew} fullWidth>
              {t('home.hasDraft.startNew')}
            </Button>
          </div>
        </div>
      ) : (
        <Button size="lg" onClick={onRegister} title={t('home.ctaHint')}>
          {t('home.ctaRegister')}
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
      )}

      {onViewHistory && (
        <button
          type="button"
          onClick={onViewHistory}
          className="mt-5 text-sm font-medium text-primary-dark hover:text-primary transition-colors inline-flex items-center gap-1.5"
        >
          {t('home.viewHistory')}
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
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      )}

      <p className="mt-12 text-xs text-graphite/50 max-w-md leading-relaxed">
        {t('home.privacyNotice')}
      </p>
    </section>
  )
}

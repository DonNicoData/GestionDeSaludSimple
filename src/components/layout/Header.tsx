import { useTranslation } from 'react-i18next'

interface HeaderProps {
  onGoHome?: () => void
  hasUnsavedData?: boolean
  /**
   * Si es false, el logo + título se renderiza como <span> (sin acción).
   * Usado durante la navegación inicial cuando todavía no sabemos si
   * hay datos en memoria. Default true.
   */
  homeEnabled?: boolean
  /**
   * Abre el panel de admin. App.tsx decide cómo navegar.
   * Si no se pasa, el botón Admin no se renderiza.
   */
  onOpenAdmin?: () => void
}

export function Header({
  onGoHome,
  hasUnsavedData = false,
  homeEnabled = true,
  onOpenAdmin,
}: HeaderProps) {
  const { t, i18n } = useTranslation()

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('es') ? 'en' : 'es'
    void i18n.changeLanguage(next)
  }

  const handleHomeClick = () => {
    if (!homeEnabled) return
    onGoHome?.()
  }

  const currentIsEs = i18n.language.startsWith('es')

  const brand = (
    <>
      <div
        aria-hidden="true"
        className="relative h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white shrink-0"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {hasUnsavedData && (
          <span
            aria-label={t('common.unsavedIndicator')}
            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-bone"
          />
        )}
      </div>
      <span className="font-semibold text-base sm:text-lg truncate">
        {t('app.name')}
      </span>
    </>
  )

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-bone/80 border-b border-divider">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {homeEnabled ? (
          <button
            type="button"
            onClick={handleHomeClick}
            aria-label={t('header.goHome', { defaultValue: 'Volver al inicio' })}
            className="flex items-center gap-2 min-w-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
          >
            {brand}
          </button>
        ) : (
          <div className="flex items-center gap-2 min-w-0">{brand}</div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t('header.languageToggle')}
            className="h-11 px-3 rounded-2xl text-sm font-medium text-graphite hover:bg-divider transition-colors flex items-center gap-1"
          >
            <span
              className={
                currentIsEs
                  ? 'text-primary font-semibold'
                  : 'text-graphite/50'
              }
            >
              {t('header.languageEs')}
            </span>
            <span className="text-graphite/30">/</span>
            <span
              className={
                !currentIsEs
                  ? 'text-primary font-semibold'
                  : 'text-graphite/50'
              }
            >
              {t('header.languageEn')}
            </span>
          </button>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="h-11 px-4 rounded-2xl text-sm font-medium border border-divider text-graphite hover:border-primary-soft hover:bg-primary-soft/30 transition-colors"
            >
              {t('header.admin')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

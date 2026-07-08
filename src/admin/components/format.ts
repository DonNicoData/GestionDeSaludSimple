import type { TFunction } from 'i18next'

/**
 * Format helper para fechas en la UI del admin. Usa el locale actual
 * (leído de i18n) y cae al ISO corto si Intl no soporta el locale.
 */
export function formatRecordDate(
  d: Date,
  t: TFunction | ((k: string) => string),
): string {
  try {
    const locale = t('common.locale') || 'es'
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 16).replace('T', ' ')
  }
}

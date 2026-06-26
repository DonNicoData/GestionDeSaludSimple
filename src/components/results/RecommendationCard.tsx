import { useTranslation } from 'react-i18next'
import { recommendedWaterIntakeLiters } from '@/lib/evaluator'

interface RecommendationCardProps {
  currentWeight: number
}

/**
 * Sección de hidratación. El título "Agua recomendada" ya nombra la
 * recomendación, así que la card interna no repite la label: arranca
 * directo con el valor y el mensaje cálido.
 *
 * Estilo espejado con `ClientProfileBanner` (mismo border / fondo) para
 * que se sienta parte del mismo bloque visual. A futuro, si sumamos
 * más recomendaciones (sueño, pasos, sol), entran como nuevas cards
 * apiladas dentro de esta misma sección.
 *
 * No usa `SemaphoreBadge`: la hidratación es una recomendación amable,
 * no una evaluación con semáforo.
 */
export function RecommendationCard({ currentWeight }: RecommendationCardProps) {
  const { t } = useTranslation()
  const liters = recommendedWaterIntakeLiters(currentWeight)

  return (
    <section
      aria-label={t('results.recommendation.title')}
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
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
        <h2 className="text-sm font-semibold text-graphite">
          {t('results.recommendation.title')}
        </h2>
      </header>

      <div className="bg-white/60 rounded-2xl p-4">
        <div className="text-2xl sm:text-3xl font-bold text-graphite tabular-nums mb-2">
          {t('results.recommendation.water.value', { liters })}
        </div>

        <p className="text-xs sm:text-sm text-graphite/70 leading-relaxed">
          {t('results.recommendation.water.hint', {
            liters,
            weight: currentWeight,
          })}
        </p>

        <p className="text-[11px] sm:text-xs text-graphite/55 leading-relaxed mt-3 pt-3 border-t border-divider/60">
          {t('results.recommendation.water.methodology')}
        </p>
      </div>
    </section>
  )
}
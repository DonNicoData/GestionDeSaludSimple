import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { ClientProfileBanner } from '@/components/results/ClientProfileBanner'
import { MetricCard } from '@/components/results/MetricCard'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { evaluate } from '@/lib/evaluator'
import type { Client, MetricEvaluation } from '@/types'

interface ResultsPageProps {
  client: Client
  record: {
    weight: number
    bmi: number
    bodyFatPct: number
    muscleMassPct: number
    calories: number
    bioAge: number
    visceralFat: number
  }
  onBack: () => void
  onConfirmSave: () => void
}

/**
 * Pantalla de resultados: aplica el evaluador sobre (record, client),
 * muestra el resumen cálido y las 7 tarjetas con semáforo.
 *
 * En esta fase el botón "Guardar" abre un modal cálido (PLAN §7.5)
 * pero NO persiste aún: el guardado real llega en Fase 6 con Dexie.
 */
export function ResultsPage({
  client,
  record,
  onBack,
  onConfirmSave,
}: ResultsPageProps) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  const evaluations: MetricEvaluation[] = useMemo(
    () => evaluate(record, client),
    [record, client],
  )

  const alerts = evaluations.filter((e) => e.status === 'alert').length
  const warnings = evaluations.filter((e) => e.status === 'warning').length

  const modalSubtitleKey =
    alerts > 0
      ? 'results.modal.subtitleWithAlerts'
      : warnings > 0
        ? 'results.modal.subtitleWithWarnings'
        : 'results.modal.subtitleAllNormal'

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">
          {t('results.title')}
        </h1>
        <p className="text-sm sm:text-base text-graphite/70 leading-relaxed">
          {t('results.subtitle')}
        </p>
      </header>

      <ClientProfileBanner client={client} currentWeight={record.weight} />

      <div className="mb-6">
        <ResultsSummary evaluations={evaluations} />
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6"
        aria-label={t('results.title')}
      >
        {evaluations.map((evaluation) => (
          <MetricCard key={evaluation.key} evaluation={evaluation} />
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          fullWidth
        >
          {t('results.buttons.back')}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => setModalOpen(true)}
          fullWidth
        >
          {t('results.buttons.save')}
        </Button>
      </div>

      {modalOpen && (
        <SaveModal
          subtitleKey={modalSubtitleKey}
          onSkip={() => {
            setModalOpen(false)
            onConfirmSave()
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  )
}

interface SaveModalProps {
  subtitleKey: string
  onSkip: () => void
  onClose: () => void
}

/**
 * Modal cálido de "guardado exitoso" (PLAN §7.5). En esta fase muestra
 * el flujo de exportación pero los botones de Excel/PDF están deshabilitados
 * porque la exportación entra en Fase 7. El guardado real en Dexie entra
 * en Fase 6.
 */
function SaveModal({ subtitleKey, onSkip, onClose }: SaveModalProps) {
  const { t } = useTranslation()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-graphite/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bone shadow-card p-5 sm:p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div
            aria-hidden="true"
            className="h-14 w-14 rounded-full bg-primary-soft flex items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-primary-dark"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2
            id="save-modal-title"
            className="text-lg sm:text-xl font-bold text-graphite"
          >
            {t('results.modal.title')}
          </h2>
          <p className="text-sm text-graphite/70 leading-relaxed">
            {t(subtitleKey)}
          </p>
        </div>

        <div className="rounded-2xl border border-divider bg-white p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-graphite">
            {t('results.modal.comingSoonTitle')}
          </p>
          <p className="text-xs text-graphite/70 leading-relaxed">
            {t('results.modal.comingSoonBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled
              fullWidth
            >
              {t('results.modal.exportExcel')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled
              fullWidth
            >
              {t('results.modal.exportPdf')}
            </Button>
          </div>
        </div>

        <Button type="button" variant="outline" size="md" onClick={onSkip} fullWidth>
          {t('results.modal.skip')}
        </Button>
      </div>
    </div>
  )
}
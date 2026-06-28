import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { ClientProfileBanner } from '@/components/results/ClientProfileBanner'
import { MetricCard } from '@/components/results/MetricCard'
import { RecommendationCard } from '@/components/results/RecommendationCard'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { evaluate } from '@/lib/evaluator'
import { createClient, saveRecord } from '@/db/repo'
import { combineName, normalizeName } from '@/lib/name'
import type { BasicDataOutput } from '@/lib/validation'
import type { MetricEvaluation } from '@/types'

interface ResultsPageProps {
  basicData: BasicDataOutput & {
    age: number
    fullName: string
    clientId?: number
  }
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
  /**
   * El usuario quiere volver al inicio SIN guardar. App.tsx decide si
   * mostrar confirmación (si hay datos sin guardar) o ir directo.
   */
  onGoHome: () => void
  /**
   * Callback al confirmar guardado exitoso: recibe el clientId creado/actualizado
   * y el nombre completo. App.tsx lo usa para refrescar el "último cliente activo".
   */
  onSaved: (clientId: number, clientName: string) => void
}

/**
 * Pantalla de resultados: aplica el evaluador sobre (record, basicData),
 * muestra el resumen cálido y las 7 tarjetas con semáforo.
 *
 * Tres salidas (P1-1):
 * - "Volver a las mediciones" → onBack (preserva todo)
 * - "Volver al inicio" → onGoHome (descarta; App.tsx puede mostrar confirmación)
 * - "Guardar mis datos" → modal cálido → crea client + record en Dexie
 */
export function ResultsPage({ basicData, record, onBack, onGoHome, onSaved }: ResultsPageProps) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const evaluationTarget = useMemo(
    () => ({
      firstName: basicData.firstName,
      lastName1: basicData.lastName1,
      lastName2: basicData.lastName2,
      normalizedName: normalizeName(
        combineName(basicData.firstName, basicData.lastName1, basicData.lastName2),
      ),
      birthDate: basicData.birthDate,
      age: basicData.age,
      gender: basicData.gender,
      heightCm: basicData.heightCm,
      wristContexture: basicData.wristContexture,
      createdAt: new Date(),
    }),
    [basicData],
  )

  const evaluations: MetricEvaluation[] = useMemo(
    () => evaluate(record, evaluationTarget),
    [record, evaluationTarget],
  )

  const alerts = evaluations.filter((e) => e.status === 'alert').length
  const warnings = evaluations.filter((e) => e.status === 'warning').length

  const handleConfirmSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      let clientId = basicData.clientId
      if (clientId == null) {
        clientId = await createClient({
          firstName: basicData.firstName,
          lastName1: basicData.lastName1,
          lastName2: basicData.lastName2,
          birthDate: basicData.birthDate,
          age: basicData.age,
          gender: basicData.gender,
          heightCm: basicData.heightCm,
          wristContexture: basicData.wristContexture,
        })
      }
      await saveRecord(clientId, {
        weight: record.weight,
        bmi: record.bmi,
        bodyFatPct: record.bodyFatPct,
        muscleMassPct: record.muscleMassPct,
        calories: record.calories,
        bioAge: record.bioAge,
        visceralFat: record.visceralFat,
      })
      setModalOpen(false)
      onSaved(clientId, basicData.fullName)
    } catch {
      setSaveError(t('results.modal.saveError'))
    } finally {
      setSaving(false)
    }
  }

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

      <ClientProfileBanner client={evaluationTarget} currentWeight={record.weight} />

      <RecommendationCard currentWeight={record.weight} />

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
          disabled={saving}
        >
          {t('results.buttons.back')}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => setModalOpen(true)}
          fullWidth
          disabled={saving}
        >
          {t('results.buttons.save')}
        </Button>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={onGoHome}
          disabled={saving}
          className="text-sm text-graphite/60 hover:text-graphite underline-offset-4 hover:underline disabled:opacity-50"
        >
          {t('results.buttons.goHome')}
        </button>
      </div>

      {modalOpen && (
        <SaveModal
          alerts={alerts}
          warnings={warnings}
          saving={saving}
          saveError={saveError}
          onConfirm={handleConfirmSave}
          onSkip={onGoHome}
          onClose={() => !saving && setModalOpen(false)}
        />
      )}
    </section>
  )
}

interface SaveModalProps {
  alerts: number
  warnings: number
  saving: boolean
  saveError: string | null
  onConfirm: () => void
  /** Salir sin guardar y volver al inicio. */
  onSkip: () => void
  /** Cancelar el modal (volver a Results sin descartar). */
  onClose: () => void
}

/**
 * Modal cálido de guardado (Fase 6, refinado P0-4).
 *
 * Tres fases visuales:
 * - Asking: "¿Querés guardar tus datos?" — pregunta antes de hacer nada.
 *   El CTA primario (izquierda) es "Guardar mis datos". El secundario
 *   es "Volver al inicio sin guardar" (label explícito de la consecuencia).
 * - Saving: durante la persistencia, botón "Guardando..." deshabilitado.
 * - Error: si Dexie falla, alert cálido con opción de reintentar.
 *
 * NOTA: el copy "¡Listo! Tus datos están guardados" se movió a HomePage
 * después del guardado exitoso (state `lastVisitDays = 0` y saludo
 * personalizado), no aquí — evita afirmar algo que no pasó todavía.
 */
function SaveModal({ alerts, warnings, saving, saveError, onConfirm, onSkip, onClose }: SaveModalProps) {
  const { t } = useTranslation()

  const summaryKey =
    alerts > 0
      ? 'results.modal.subtitleWithAlerts'
      : warnings > 0
        ? 'results.modal.subtitleWithWarnings'
        : 'results.modal.subtitleAllNormal'

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
            {t('results.modal.askBody')}
          </p>
          {summaryKey && (alerts > 0 || warnings > 0) && (
            <p className="text-xs text-graphite/50 italic">{t(summaryKey)}</p>
          )}
        </div>

        {saveError && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-alert bg-alert/10 p-3 text-sm text-alert"
          >
            {saveError}
          </div>
        )}

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

        {/* Orden invertido respecto a Fase 5: primary a la izquierda.
            Móvil (col-reverse): "Confirmar guardar" arriba, "Volver al inicio
            sin guardar" abajo. */}
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onSkip}
            fullWidth
            disabled={saving}
          >
            {t('results.modal.skip')}
          </Button>
          <Button
            type="button"
            size="md"
            onClick={onConfirm}
            fullWidth
            disabled={saving}
          >
            {saving ? t('common.saving') : t('results.modal.confirmSave')}
          </Button>
        </div>
      </div>
    </div>
  )
}
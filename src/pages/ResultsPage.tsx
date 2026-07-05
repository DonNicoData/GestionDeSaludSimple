import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import { useToast } from '@/components/shared/Toast'
import { ClientProfileBanner } from '@/components/results/ClientProfileBanner'
import { MetricCard } from '@/components/results/MetricCard'
import { RecommendationCard } from '@/components/results/RecommendationCard'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { evaluate } from '@/lib/evaluator'
import { createClient, getClient, getRecordsForClient, saveRecord } from '@/db/repo'
import { combineName, normalizeName } from '@/lib/name'
import { useExportHistory } from '@/hooks/useExportHistory'
import { pickRecordsForScope, type ExportScope } from '@/lib/export/scope'
import type { BasicDataOutput } from '@/lib/validation'
import type { Client, MetricEvaluation } from '@/types'

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
  /**
   * Navegar a la pantalla de historial del cliente activo. Se ofrece
   * como link secundario dentro del modal post-guardado, ya que en el
   * Home solo aparece condicional al flag de sesión.
   */
  onViewHistory?: () => void
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
export function ResultsPage({ basicData, record, onBack, onGoHome, onSaved, onViewHistory }: ResultsPageProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const { runExport } = useExportHistory()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedClientId, setSavedClientId] = useState<number | null>(null)
  /** ID del record recién persistido. Necesario para filtrar scope='current'. */
  const [savedRecordId, setSavedRecordId] = useState<number | null>(null)
  /** Cantidad total de records del cliente post-guardado. Determina si se muestra el selector de scope. */
  const [savedRecordsCount, setSavedRecordsCount] = useState(0)
  /** Alcance del export: solo la medición recién guardada o el historial completo. */
  const [exportScope, setExportScope] = useState<ExportScope>('current')
  const [exporting, setExporting] = useState<null | 'xlsx' | 'pdf'>(null)

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
      const recordId = await saveRecord(clientId, {
        weight: record.weight,
        bmi: record.bmi,
        bodyFatPct: record.bodyFatPct,
        muscleMassPct: record.muscleMassPct,
        calories: record.calories,
        bioAge: record.bioAge,
        visceralFat: record.visceralFat,
      })
      // Traer el conteo de records para decidir si mostrar el selector
      // de scope (solo si hay más de una medición, sino la decisión es trivial).
      const allRecords = await getRecordsForClient(clientId)
      setSavedClientId(clientId)
      setSavedRecordId(recordId)
      setSavedRecordsCount(allRecords.length)
      setExportScope('current')
      setSaved(true)
      // NO cerramos el modal: pasamos a la fase "saved" con botones de export.
    } catch {
      setSaveError(t('results.modal.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleSkipAfterSave = () => {
    if (savedClientId != null) {
      onSaved(savedClientId, basicData.fullName)
    } else {
      onGoHome()
    }
  }

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    if (savedClientId == null || savedRecordId == null) return
    setExporting(format)
    try {
      const [client, records] = await Promise.all([
        getClient(savedClientId),
        getRecordsForClient(savedClientId),
      ])
      if (!client) throw new Error('client-not-found')
      const subset = pickRecordsForScope(records, exportScope, savedRecordId)
      runExport(client as Client, subset, format)
      toast.show(t('toast.exportSuccess'))
    } catch {
      toast.show(t('toast.exportError'), 'error')
    } finally {
      setExporting(null)
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
          saved={saved}
          exporting={exporting}
          savedRecordsCount={savedRecordsCount}
          exportScope={exportScope}
          onChangeExportScope={setExportScope}
          onConfirm={handleConfirmSave}
          onExport={handleExport}
          onSkipAfterSave={handleSkipAfterSave}
          onViewHistory={onViewHistory}
          onClose={() => !saving && !exporting && setModalOpen(false)}
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
  saved: boolean
  exporting: null | 'xlsx' | 'pdf'
  /** Cantidad total de records del cliente. Si > 1, se muestra el selector de scope. */
  savedRecordsCount: number
  /** Alcance elegido para el export. */
  exportScope: ExportScope
  /** Cambia el alcance del export. */
  onChangeExportScope: (scope: ExportScope) => void
  onConfirm: () => void
  onExport: (format: 'xlsx' | 'pdf') => void
  /** Después de guardar: salir y volver al inicio (o a donde decida el padre). */
  onSkipAfterSave: () => void
  /** Cancelar el modal (volver a Results sin descartar). */
  onClose: () => void
  /** Navegar a la pantalla de historial del cliente. Mostrado como link secundario post-guardado. */
  onViewHistory?: () => void
}

/**
 * Modal cálido de guardado (Fase 6, refinado P0-4; Fase 7 export).
 *
 * Cuatro fases visuales:
 * - Asking: "¿Querés guardar tus datos?" — pregunta antes de hacer nada.
 *   El CTA primario (izquierda) es "Guardar mis datos". El secundario
 *   es "Volver al inicio sin guardar" (label explícito de la consecuencia).
 * - Saving: durante la persistencia, botón "Guardando..." deshabilitado.
 * - Error: si Dexie falla, alert cálido con opción de reintentar.
 * - Saved: post-guardado. CTA cambia a "¿Querés descargar tu historial?".
 *   Botones Excel / PDF disparan exportToExcel / exportToPdf. El toast
 *   efímero confirma éxito o error. Botón "Ahora no, gracias" cierra
 *   el modal y vuelve al inicio.
 *
 * NOTA: el copy "¡Listo! Tus datos están guardados" se movió a HomePage
 * después del guardado exitoso (state `lastVisitDays = 0` y saludo
 * personalizado), no aquí — evita afirmar algo que no pasó todavía.
 *
 * Skip del modal = "Volver al inicio". El detail cálido de "sin guardar"
 * se traslada al DiscardConfirmDialog que abre App.tsx por detrás, no
 * al texto del botón (que de otro modo sería largo y agresiva).
 */
function SaveModal({
  alerts,
  warnings,
  saving,
  saveError,
  saved,
  exporting,
  savedRecordsCount,
  exportScope,
  onChangeExportScope,
  onConfirm,
  onExport,
  onSkipAfterSave,
  onViewHistory,
  onClose,
}: SaveModalProps) {
  const { t } = useTranslation()

  const summaryKey =
    alerts > 0
      ? 'results.modal.subtitleWithAlerts'
      : warnings > 0
        ? 'results.modal.subtitleWithWarnings'
        : 'results.modal.subtitleAllNormal'

  const showScopeSelector = saved && savedRecordsCount > 1

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
              {saved ? (
                <path d="M20 6 9 17l-5-5" />
              ) : (
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />
              )}
            </svg>
          </div>
          <h2
            id="save-modal-title"
            className="text-lg sm:text-xl font-bold text-graphite"
          >
            {saved ? t('results.modal.savedTitle') : t('results.modal.title')}
          </h2>
          <p className="text-sm text-graphite/70 leading-relaxed">
            {saved ? t('results.modal.savedBody') : t('results.modal.askBody')}
          </p>
          {!saved && (alerts > 0 || warnings > 0) && (
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

        {saved ? (
          <div className="rounded-2xl border border-divider bg-white p-4 flex flex-col gap-3">
            {showScopeSelector && (
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-semibold text-graphite mb-1">
                  {t('results.modal.exportScopeQuestion')}
                </legend>
                <label
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    exportScope === 'current'
                      ? 'border-primary bg-primary-soft/40 text-graphite font-medium'
                      : 'border-divider text-graphite/80 hover:bg-primary-soft/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value="current"
                    checked={exportScope === 'current'}
                    onChange={() => onChangeExportScope('current')}
                    className="accent-primary"
                  />
                  {t('results.modal.exportScopeCurrent')}
                </label>
                <label
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    exportScope === 'history'
                      ? 'border-primary bg-primary-soft/40 text-graphite font-medium'
                      : 'border-divider text-graphite/80 hover:bg-primary-soft/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value="history"
                    checked={exportScope === 'history'}
                    onChange={() => onChangeExportScope('history')}
                    className="accent-primary"
                  />
                  {t('results.modal.exportScopeHistory')}
                </label>
              </fieldset>
            )}
            <p className="text-sm font-semibold text-graphite">
              {t('results.modal.exportQuestion')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => onExport('xlsx')}
                disabled={exporting != null}
                fullWidth
              >
                {exporting === 'xlsx' ? t('common.saving') : t('results.modal.exportExcel')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => onExport('pdf')}
                disabled={exporting != null}
                fullWidth
              >
                {exporting === 'pdf' ? t('common.saving') : t('results.modal.exportPdf')}
              </Button>
            </div>
            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                disabled={exporting != null}
                className="text-sm font-medium text-primary-dark hover:text-primary transition-colors self-start mt-1 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {t('results.modal.viewHistoryLink')}
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
          </div>
        ) : null}

        {/* Botonera inferior: cambia entre "asking" y "saved". */}
        {saved ? (
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              size="md"
              onClick={onSkipAfterSave}
              fullWidth
              disabled={exporting != null}
            >
              {t('results.modal.savedGoHome')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onSkipAfterSave}
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
        )}
      </div>
    </div>
  )
}
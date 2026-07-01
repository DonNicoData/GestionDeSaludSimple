import { useCallback, useEffect, useRef, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import { MetricsPage } from '@/pages/MetricsPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { DiscardConfirmDialog } from '@/components/shared/DiscardConfirmDialog'
import { ToastProvider } from '@/components/shared/Toast'
import {
  clearAllDrafts,
  clearDraftByKey,
  DRAFT_KEY_BASIC,
  DRAFT_KEY_METRICS,
  hasAnyDraft,
} from '@/hooks/useFormDraftDB'
import { getLatestRecordContext } from '@/db/repo'
import { fullNameOf } from '@/lib/name'
import type { BasicDataOutput, MetricsOutput } from '@/lib/validation'

type Page = 'home' | 'form' | 'metrics' | 'results' | 'history'

interface BasicDataState extends BasicDataOutput {
  age: number
  fullName: string
  clientId?: number
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [basicData, setBasicData] = useState<BasicDataState | null>(null)
  const [metrics, setMetrics] = useState<MetricsOutput | null>(null)
  const [lastVisitDays, setLastVisitDays] = useState<number | null>(null)
  const [activeClientId, setActiveClientId] = useState<number | null>(null)
  const [activeClientName, setActiveClientName] = useState<string | null>(null)

  // Discard confirmation: cuando el usuario intenta salir con datos en memoria.
  const [discardOpen, setDiscardOpen] = useState(false)
  const discardCallbackRef = useRef<(() => void) | null>(null)

  /**
   * Hay datos "sin guardar" si tenemos basicData o metrics cargados en
   * memoria pero todavía no se persistió un record en Dexie. Esto es lo
   * que dispara el indicador ámbar del header y la confirmación al descartar.
   */
  const hasUnsavedFlowData = basicData != null || metrics != null

  /**
   * Resetea los datos en memoria pero MANTIENE los drafts en IndexedDB.
   * Se usa al descartar (skip / Volver al inicio / home navegando). Los
   * borradores siguen en DB para que el usuario pueda retomar.
   *
   * Solo `clearAllDrafts` se usa cuando el usuario explícitamente dice
   * "Empezar de nuevo" desde el banner del Home.
   */
  const navigate = useCallback((next: Page, opts?: { clearDrafts?: boolean }) => {
    if (next === 'home') {
      if (opts?.clearDrafts) {
        void clearAllDrafts()
        void hasAnyDraft().then(setHasDraft)
      }
      setBasicData(null)
      setMetrics(null)
    }
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const refreshHasDraft = useCallback(() => {
    void hasAnyDraft().then(setHasDraft)
  }, [])

  // P1-5: hidratar al montar — última visita + nombre del cliente activo.
  useEffect(() => {
    void hasAnyDraft().then(setHasDraft)
    void getLatestRecordContext().then((ctx) => {
      if (!ctx || ctx.client.id == null) return
      const diffMs = Date.now() - ctx.record.date.getTime()
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      setLastVisitDays(days)
      setActiveClientId(ctx.client.id)
      setActiveClientName(fullNameOf(ctx.client))
    })
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshHasDraft()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [refreshHasDraft])

  const handleStartNew = useCallback(() => {
    void clearAllDrafts()
    setHasDraft(false)
  }, [])

  const handleBasicDataSubmit = useCallback(
    (data: BasicDataState) => {
      setBasicData(data)
      // P0-1: NO borramos el draft básico aquí. El draft es la red de
      // seguridad del usuario y debe sobrevivir a F5, cierre de pestaña y
      // navegación "atrás". Solo se borra cuando el record se guarda OK
      // en handleResultsSaved.
      navigate('metrics')
    },
    [navigate],
  )

  const handleMetricsSubmit = useCallback(
    (data: MetricsOutput) => {
      setMetrics(data)
      navigate('results')
    },
    [navigate],
  )

  const handleResultsSaved = useCallback(
    (clientId: number, clientName: string) => {
      setActiveClientId(clientId)
      setActiveClientName(clientName)
      setLastVisitDays(0)
      setBasicData(null)
      setMetrics(null)
      // P0-2: el record se persistió OK → ya no hacen falta los borradores.
      void clearDraftByKey(DRAFT_KEY_BASIC)
      void clearDraftByKey(DRAFT_KEY_METRICS)
      void hasAnyDraft().then(setHasDraft)
      navigate('home')
    },
    [navigate],
  )

  const handleViewHistory = useCallback(() => {
    if (activeClientId != null) {
      navigate('history')
    }
  }, [activeClientId, navigate])

  // P1-3 / P1-4: navegación con protección de datos + indicador.
  /**
   * Pide ir al inicio. Si hay datos sin guardar en memoria, abre el
   * DiscardConfirmDialog; el callback de éxito (`onConfirmed`) solo se
   * ejecuta cuando el usuario acepta descartar.
   */
  const requestGoHome = useCallback(() => {
    const performGoHome = () => navigate('home', { clearDrafts: true })
    if (hasUnsavedFlowData) {
      discardCallbackRef.current = performGoHome
      setDiscardOpen(true)
      return
    }
    performGoHome()
  }, [hasUnsavedFlowData, navigate])

  const handleStayDiscard = useCallback(() => {
    discardCallbackRef.current = null
    setDiscardOpen(false)
  }, [])

  const handleDiscardConfirmed = useCallback(() => {
    setDiscardOpen(false)
    const next = discardCallbackRef.current
    discardCallbackRef.current = null
    next?.()
  }, [])

  // Para llamar desde header/logo: equivalente a requestGoHome.
  const handleHeaderGoHome = useCallback(() => {
    requestGoHome()
  }, [requestGoHome])

  return (
    <ToastProvider>
      <Header
        onGoHome={handleHeaderGoHome}
        hasUnsavedData={hasUnsavedFlowData}
      />
      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onRegister={() => navigate('form')}
            hasDraft={hasDraft}
            onStartNew={handleStartNew}
            lastVisitDays={lastVisitDays}
            knownClientName={activeClientName ?? undefined}
            onViewHistory={activeClientId != null ? handleViewHistory : undefined}
          />
        )}
        {page === 'form' && (
          <FormPage
            onBack={() => navigate('home')}
            onContinue={handleBasicDataSubmit}
          />
        )}
        {page === 'metrics' && (
          <MetricsPage
            onBack={() => navigate('form')}
            onContinue={handleMetricsSubmit}
          />
        )}
        {page === 'results' && basicData && metrics && (
          <ResultsPage
            basicData={basicData}
            record={metrics}
            onBack={() => navigate('metrics')}
            onGoHome={requestGoHome}
            onSaved={handleResultsSaved}
          />
        )}
        {page === 'history' && activeClientId != null && (
          <HistoryPage
            clientId={activeClientId}
            onBack={() => navigate('home')}
          />
        )}
      </main>

      <DiscardConfirmDialog
        open={discardOpen}
        onStay={handleStayDiscard}
        onDiscard={handleDiscardConfirmed}
      />
    </ToastProvider>
  )
}

export default App
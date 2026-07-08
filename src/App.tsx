import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
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
import { readSessionSavedFlag, writeSessionSavedFlag } from '@/lib/sessionFlag'
import type { BasicDataOutput, MetricsOutput } from '@/lib/validation'

// Fase 8: admin lazy-loaded. El bundle completo del admin (bcryptjs,
// todas las páginas y modales) NO se descarga hasta que el usuario
// hace click en "Admin". Reduce el TTI del flujo cliente.
// PLAN §9: "Code splitting (admin lazy-loaded)".
const AdminApp = lazy(() =>
  import('@/admin/AdminApp').then((m) => ({ default: m.AdminApp })),
)

type Page = 'home' | 'form' | 'metrics' | 'results' | 'history' | 'admin'

interface BasicDataState extends BasicDataOutput {
  age: number
  fullName: string
  clientId?: number
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-bone flex items-center justify-center">
      <div className="text-graphite/60 text-sm">Cargando panel…</div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [basicData, setBasicData] = useState<BasicDataState | null>(null)
  const [metrics, setMetrics] = useState<MetricsOutput | null>(null)
  const [lastVisitDays, setLastVisitDays] = useState<number | null>(null)
  const [activeClientId, setActiveClientId] = useState<number | null>(null)
  const [activeClientName, setActiveClientName] = useState<string | null>(null)
  const [hasSavedInSession, setHasSavedInSession] = useState<boolean>(() =>
    readSessionSavedFlag(),
  )

  const [discardOpen, setDiscardOpen] = useState(false)
  const discardCallbackRef = useRef<(() => void) | null>(null)

  const hasUnsavedFlowData = basicData != null || metrics != null

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
      void clearDraftByKey(DRAFT_KEY_BASIC)
      void clearDraftByKey(DRAFT_KEY_METRICS)
      void hasAnyDraft().then(setHasDraft)
      setHasSavedInSession(true)
      writeSessionSavedFlag()
      navigate('home')
    },
    [navigate],
  )

  const handleViewHistory = useCallback(() => {
    if (activeClientId != null) {
      navigate('history')
    }
  }, [activeClientId, navigate])

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

  const handleHeaderGoHome = useCallback(() => {
    requestGoHome()
  }, [requestGoHome])

  const openAdmin = useCallback(() => {
    // Si hay datos sin guardar, pedimos descartar antes de entrar al
    // admin. Mantener consistencia con cualquier otra navegación.
    if (hasUnsavedFlowData) {
      discardCallbackRef.current = () => setPage('admin')
      setDiscardOpen(true)
      return
    }
    setPage('admin')
  }, [hasUnsavedFlowData])

  const closeAdmin = useCallback(() => {
    setPage('home')
  }, [])

  // Cuando estamos en el admin, NO renderizamos el Header de la app
  // cliente (el admin trae su propio header con su propia navegación).
  // El admin no debería tener el indicador de "datos sin guardar"
  // porque está fuera del flujo de captura.
  if (page === 'admin') {
    return (
      <Suspense fallback={<AdminSkeleton />}>
        <AdminApp onClose={closeAdmin} />
      </Suspense>
    )
  }

  return (
    <ToastProvider>
      <Header
        onGoHome={handleHeaderGoHome}
        hasUnsavedData={hasUnsavedFlowData}
        onOpenAdmin={openAdmin}
      />
      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onRegister={() => navigate('form')}
            hasDraft={hasDraft}
            onStartNew={handleStartNew}
            lastVisitDays={lastVisitDays}
            knownClientName={activeClientName ?? undefined}
            onViewHistory={hasSavedInSession ? handleViewHistory : undefined}
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
            onViewHistory={handleViewHistory}
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
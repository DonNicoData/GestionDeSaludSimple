import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import { MetricsPage } from '@/pages/MetricsPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { HistoryPage } from '@/pages/HistoryPage'
import {
  clearAllDrafts,
  clearDraftByKey,
  DRAFT_KEY_BASIC,
  DRAFT_KEY_METRICS,
  hasAnyDraft,
} from '@/hooks/useFormDraftDB'
import { getLatestRecord } from '@/db/repo'
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

  const navigate = useCallback(
    (next: Page) => {
      if (next === 'home') {
        void clearAllDrafts()
        void hasAnyDraft().then(setHasDraft)
        setBasicData(null)
        setMetrics(null)
      }
      setPage(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [],
  )

  const refreshHasDraft = useCallback(() => {
    void hasAnyDraft().then(setHasDraft)
  }, [])

  // Hidratar al montar: ¿hay borradores? ¿cuándo fue la última visita?
  useEffect(() => {
    void hasAnyDraft().then(setHasDraft)
    void getLatestRecord().then((rec) => {
      if (rec) {
        const diffMs = Date.now() - rec.date.getTime()
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        setLastVisitDays(days)
        setActiveClientId(rec.clientId)
      }
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
      // El draft básico ya no se necesita; el de métricas empieza vacío.
      void clearDraftByKey(DRAFT_KEY_BASIC)
      void hasAnyDraft().then(setHasDraft)
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
      // El draft de métricas ya quedó persistido en el record → se limpia.
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

  return (
    <>
      <Header />
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
    </>
  )
}

export default App
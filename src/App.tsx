import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import { MetricsPage } from '@/pages/MetricsPage'
import { ResultsPage } from '@/pages/ResultsPage'
import { clearAllDrafts, hasAnyDraft } from '@/hooks/useFormDraft'
import type { BasicDataOutput, MetricsOutput } from '@/lib/validation'

type Page = 'home' | 'form' | 'metrics' | 'results'

interface BasicDataState extends BasicDataOutput {
  age: number
  fullName: string
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [hasDraft, setHasDraft] = useState<boolean>(() => hasAnyDraft())
  const [basicData, setBasicData] = useState<BasicDataState | null>(null)
  const [metrics, setMetrics] = useState<MetricsOutput | null>(null)

  const navigate = useCallback(
    (next: Page) => {
      if (next === 'home') {
        clearAllDrafts()
        setHasDraft(false)
        setBasicData(null)
        setMetrics(null)
      }
      setPage(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [],
  )

  const refreshHasDraft = useCallback(() => {
    setHasDraft(hasAnyDraft())
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
    clearAllDrafts()
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

  const handleResultsConfirm = useCallback(() => {
    navigate('home')
  }, [navigate])

  return (
    <>
      <Header />
      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            onRegister={() => navigate('form')}
            hasDraft={hasDraft}
            onStartNew={handleStartNew}
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
            client={{
              id: 0,
              firstName: basicData.firstName,
              lastName1: basicData.lastName1,
              lastName2: basicData.lastName2,
              birthDate: basicData.birthDate,
              age: basicData.age,
              gender: basicData.gender,
              heightCm: basicData.heightCm,
              wristContexture: basicData.wristContexture,
              createdAt: new Date(),
            }}
            record={metrics}
            onBack={() => navigate('metrics')}
            onConfirmSave={handleResultsConfirm}
          />
        )}
      </main>
    </>
  )
}

export default App
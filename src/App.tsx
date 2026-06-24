import { useCallback, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import { MetricsPage } from '@/pages/MetricsPage'
import type { BasicDataInput, MetricsOutput } from '@/lib/validation'

type Page = 'home' | 'form' | 'metrics'

export interface BasicData extends BasicDataInput {
  age: number
  fullName: string
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [basicData, setBasicData] = useState<BasicData | null>(null)
  const [, setMetrics] = useState<MetricsOutput | null>(null)

  const navigate = useCallback((next: Page) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBasicDataSubmit = useCallback((data: BasicData) => {
    setBasicData(data)
    navigate('metrics')
  }, [navigate])

  const handleMetricsSubmit = useCallback((data: MetricsOutput) => {
    setMetrics(data)
    const summary = [
      `Cliente: ${basicData?.fullName ?? '—'}`,
      `Peso: ${data.weight} kg`,
      `IMC: ${data.bmi || '—'}`,
      `% grasa: ${data.bodyFatPct || '—'}`,
      `% músculo: ${data.muscleMassPct || '—'}`,
      `Calorías: ${data.calories} kcal`,
      `Edad biológica: ${data.bioAge || '—'}`,
      `Grasa visceral: ${data.visceralFat}`,
    ].join('\n')
    window.alert(`Métricas OK. Próximamente: resultados (Fase 5).\n\n${summary}`)
  }, [basicData])

  return (
    <>
      <Header />
      <main className="flex-1">
        {page === 'home' && <HomePage onRegister={() => navigate('form')} />}
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
      </main>
    </>
  )
}

export default App

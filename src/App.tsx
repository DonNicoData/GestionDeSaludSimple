import { useCallback, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import type { BasicDataInput } from '@/lib/validation'

type Page = 'home' | 'form' | 'metrics'

export interface BasicData extends BasicDataInput {
  age: number
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [, setBasicData] = useState<BasicData | null>(null)

  const navigate = useCallback((next: Page) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBasicDataSubmit = useCallback((data: BasicData) => {
    setBasicData(data)
    // Fase 3 conectará aquí la navegación a métricas.
    window.alert('Datos básicos OK. Próximamente: métricas (Fase 3).')
  }, [])

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
      </main>
    </>
  )
}

export default App

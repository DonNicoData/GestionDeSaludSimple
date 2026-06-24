import { useCallback, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import type { BasicDataInput } from '@/lib/validation'

type Page = 'home' | 'form' | 'metrics'

export interface BasicData extends BasicDataInput {
  age: number
  fullName: string
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
    window.alert(`Datos básicos OK: ${data.fullName}. Próximamente: métricas (Fase 3).`)
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

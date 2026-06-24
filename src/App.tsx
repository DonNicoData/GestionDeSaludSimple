import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'
import { FormPage } from '@/pages/FormPage'
import { MetricsPage } from '@/pages/MetricsPage'
import { clearAllDrafts, hasAnyDraft } from '@/hooks/useFormDraft'

type Page = 'home' | 'form' | 'metrics'

function App() {
  const [page, setPage] = useState<Page>('home')
  const [hasDraft, setHasDraft] = useState<boolean>(() => hasAnyDraft())

  const navigate = useCallback(
    (next: Page) => {
      // Limpiar borradores al volver al Home (regla del usuario)
      if (next === 'home') {
        clearAllDrafts()
        setHasDraft(false)
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

  const handleBasicDataSubmit = useCallback(() => {
    // El borrador persiste automáticamente al submit (Form ya lo guardó).
    // Solo necesitamos avanzar a la siguiente pantalla.
    navigate('metrics')
  }, [navigate])

  const handleMetricsSubmit = useCallback(() => {
    // Placeholder para Fase 5/6: aquí se guardará el registro en la DB.
    // Por ahora solo informamos al usuario y limpiamos borradores.
    clearAllDrafts()
    setHasDraft(false)
    window.alert(
      'Métricas registradas. Resultados y guardado persistente llegan en próximas fases.',
    )
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
      </main>
    </>
  )
}

export default App

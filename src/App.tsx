import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { HomePage } from '@/pages/HomePage'

type Page = 'home' | 'form' | 'results' | 'admin'

function App() {
  const [page] = useState<Page>('home')

  return (
    <>
      <Header />
      <main className="flex-1">
        {page === 'home' && <HomePage />}
      </main>
    </>
  )
}

export default App

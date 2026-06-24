import { MetricsForm } from '@/components/form/MetricsForm'
import type { MetricsOutput } from '@/lib/validation'

interface MetricsPageProps {
  onBack: () => void
  onContinue: (metrics: MetricsOutput) => void
}

export function MetricsPage({ onBack, onContinue }: MetricsPageProps) {
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <MetricsForm onSubmit={onContinue} onBack={onBack} />
    </section>
  )
}

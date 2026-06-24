import type { BasicDataInput } from '@/lib/validation'
import { BasicDataForm } from '@/components/form/BasicDataForm'

interface FormPageProps {
  onBack: () => void
  onContinue: (basicData: BasicDataInput & { age: number; fullName: string }) => void
}

export function FormPage({ onBack, onContinue }: FormPageProps) {
  return (
    <section className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <BasicDataForm onSubmit={onContinue} onBack={onBack} />
    </section>
  )
}

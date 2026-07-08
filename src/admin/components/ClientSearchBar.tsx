import { useTranslation } from 'react-i18next'
import { Input } from '@/components/shared/Input'

interface ClientSearchBarProps {
  value: string
  onChange: (v: string) => void
}

/**
 * Input de búsqueda. Sin debounce manual: el filtrado usa
 * `useDeferredValue` en el padre (useClients) para mantener el typing
 * fluido.
 */
export function ClientSearchBar({ value, onChange }: ClientSearchBarProps) {
  const { t } = useTranslation()
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite/40 pointer-events-none"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <Input
        id="client-search"
        type="text"
        autoComplete="off"
        value={value}
        onChange={onChange}
        onBlur={() => {}}
        placeholder={t('admin.search.placeholder')}
        className="pl-10"
        state="neutral"
      />
    </div>
  )
}

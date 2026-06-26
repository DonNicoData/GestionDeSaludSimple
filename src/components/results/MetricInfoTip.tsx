interface MetricInfoTipProps {
  /** Texto del tooltip (viene de i18n). */
  description: string
  /** aria-label accesible para el botón (viene de i18n). */
  buttonLabel: string
}

/**
 * Tooltip informativo para métricas que no son peso.
 *
 * Implementación con `<details>/<summary>` nativos del HTML:
 *  - Cero JavaScript para abrir/cerrar.
 *  - Accesible por teclado y lector de pantalla de fábrica.
 *  - Mismo comportamiento en desktop (click) y mobile (tap).
 *  - El contenido aparece inline debajo del summary cuando se abre.
 *
 * Se posiciona junto al `<SemaphoreBadge>` en el header de la card.
 * El peso NO usa este componente porque ya muestra su metodología
 * inline (es información de otro tipo: "cómo se calculó").
 */
export function MetricInfoTip({ description, buttonLabel }: MetricInfoTipProps) {
  return (
    <details className="group relative">
      <summary
        aria-label={buttonLabel}
        className="list-none cursor-pointer h-6 w-6 rounded-full inline-flex items-center justify-center text-graphite/50 hover:text-graphite hover:bg-divider/60 transition-colors [&::-webkit-details-marker]:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full mt-2 z-10 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-divider bg-white shadow-card p-3 text-xs text-graphite/80 leading-relaxed">
        {description}
      </div>
    </details>
  )
}
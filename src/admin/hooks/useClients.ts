/**
 * Hook de listado de clientes para el admin.
 *
 * Carga inicial: trae TODOS los clientes + última medición en una sola
 * pasada por cliente. El conteo de records se obtiene junto con la
 * última (paralelizado por cliente, con `Promise.all`).
 *
 * Búsqueda: `setSearch` actualiza un state local sin debounce manual;
 * el filtrado se hace con `useDeferredValue` (React 18) para que el
 * typing se sienta fluido (PLAN §9: "Búsqueda con debounce 300ms").
 *
 * Por qué `useDeferredValue` y no `setTimeout(300)`:
 * - Es nativo de React 18, sin cleanup de timer.
 * - Cancela el re-render previo si el usuario sigue tipeando.
 * - Para < 20 clientes (PLAN §1), filtrar 20 strings es O(N) trivial
 *   y el diferido se ve instantáneo. Un debounce de 300ms agrega
 *   latencia visible sin beneficio para este tamaño de dataset.
 */
import { useEffect, useMemo, useState, useDeferredValue } from 'react'
import {
  getLastRecordForClient,
  getRecordsForClient,
  listAllClients,
} from '@/db/repo'
import { fullNameOf } from '@/lib/name'
import type { Client, Record } from '@/types'

export interface ClientListItem {
  client: Client
  lastRecord: Record | undefined
  recordCount: number
}

export interface UseClientsResult {
  items: ClientListItem[]
  allItems: ClientListItem[]
  loading: boolean
  search: string
  setSearch: (s: string) => void
  isFiltered: boolean
  refresh: () => void
}

export function useClients(): UseClientsResult {
  const [allItems, setAllItems] = useState<ClientListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      const clients = await listAllClients()
      // Una pasada paralela: por cada cliente, pedimos su última medición
      // y la cantidad total. Ambas queries van en paralelo y, dado que
      // cada cliente resuelve 2 queries en una misma transacción lógica,
      // no hay race en datos.
      const enriched = await Promise.all(
        clients.map(async (c) => {
          if (c.id == null) {
            return { client: c, lastRecord: undefined, recordCount: 0 }
          }
          const [last, all] = await Promise.all([
            getLastRecordForClient(c.id),
            getRecordsForClient(c.id),
          ])
          return { client: c, lastRecord: last, recordCount: all.length }
        }),
      )
      if (cancelled) return
      setAllItems(enriched)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const items: ClientListItem[] = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter((item) => {
      const name = fullNameOf(item.client).toLowerCase()
      return name.includes(q)
    })
  }, [allItems, deferredSearch])

  const refresh = () => setReloadKey((k) => k + 1)

  return {
    items,
    allItems,
    loading,
    search,
    setSearch,
    isFiltered: deferredSearch.trim().length > 0,
    refresh,
  }
}

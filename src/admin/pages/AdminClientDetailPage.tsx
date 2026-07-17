import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/shared/Button'
import {
  deleteClient,
  deleteRecord,
  getClient,
  getClientSnapshot,
  getRecordsForClient,
  restoreClientSnapshot,
  updateClient,
  updateRecord,
} from '@/db/repo'
import { fullNameOf } from '@/lib/name'
import { useUndoToast } from '@/admin/components/UndoToast'
import { EditClientModal } from '@/admin/components/EditClientModal'
import { EditRecordModal } from '@/admin/components/EditRecordModal'
import { DeleteClientDialog } from '@/admin/components/DeleteClientDialog'
import { formatRecordDate } from '@/admin/components/format'
import type { Client, Record } from '@/types'
import type { CreateClientInput, CreateRecordInput } from '@/db/repo'

interface AdminClientDetailPageProps {
  clientId: number
  onBack: () => void
}

/**
 * Detalle de un cliente: datos personales, mediciones, acciones de
 * edición y borrado (con undo).
 *
 * Patrón de borrado (basado en NN/g):
 * - Borrar record = undo 5s, sin modal previo ("ofrecer undo > pedir
 *   confirmación genérica"). El item se marca pending en UI; si pasan
 *   5s sin deshacer, commit real en DB.
 * - Borrar cliente = DeleteClientDialog con tipeo del nombre + undo 5s
 *   post-confirmación. Doble barrera porque el cascade es destructivo.
 */
export function AdminClientDetailPage({
  clientId,
  onBack,
}: AdminClientDetailPageProps) {
  const { t } = useTranslation()
  const undoToast = useUndoToast()

  const [client, setClient] = useState<Client | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  const [editClientOpen, setEditClientOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<Record | null>(null)
  const [deleteClientOpen, setDeleteClientOpen] = useState(false)
  /** id del cliente "soft-deleted" (UI lo muestra apagado). */
  const [softDeletedClientId, setSoftDeletedClientId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const [c, r] = await Promise.all([
      getClient(clientId),
      getRecordsForClient(clientId),
    ])
    setClient(c ?? null)
    setRecords(r)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [clientId])

  const handleClientSaved = async () => {
    setEditClientOpen(false)
    await load()
  }

  const handleRecordSaved = async () => {
    setEditRecord(null)
    await load()
  }

  /**
   * Borrar record: soft delete en UI + timer 5s + commit diferido.
   * Si el usuario hace undo dentro de la ventana, revivimos el item.
   */
  const handleDeleteRecord = (rec: Record) => {
    if (rec.id == null) return
    const id = rec.id
    const snapshot = structuredClone(rec)
    // Soft delete en UI.
    setRecords((prev) => prev.filter((r) => r.id !== id))
    // Disparar undo toast. Si no se deshace, commitea el delete real.
    undoToast.showUndo({
      message: t('admin.deleteRecord.undo', {
        date: formatRecordDate(snapshot.date, t),
      }),
      onUndo: () => {
        setRecords((prev) => {
          if (prev.find((r) => r.id === id)) return prev
          return [...prev, snapshot].sort(
            (a, b) => b.date.getTime() - a.date.getTime(),
          )
        })
      },
      onCommit: async () => {
        try {
          await deleteRecord(id)
        } catch {
          // Si el commit falla, revivimos el item (no se perdió de DB
          // tampoco, así que el state queda consistente).
          setRecords((prev) => {
            if (prev.find((r) => r.id === id)) return prev
            return [...prev, snapshot].sort(
              (a, b) => b.date.getTime() - a.date.getTime(),
            )
          })
        }
      },
    })
  }

  /**
   * Borrar cliente: tipeo en DeleteClientDialog + soft delete + undo 5s.
   * Si el usuario deshace, restauramos cliente + records vía
   * restoreClientSnapshot. Si no, commit real (deleteClient cascade).
   */
  const handleDeleteClient = async () => {
    const snap = await getClientSnapshot(clientId)
    if (!snap) return
    setDeleteClientOpen(false)
    setSoftDeletedClientId(clientId)
    const name = fullNameOf(snap.client)
    undoToast.showUndo({
      message: t('admin.deleteClient.undo', { name }),
      onUndo: async () => {
        const newId = await restoreClientSnapshot(snap)
        setSoftDeletedClientId(null)
        // Si el cliente fue restaurado con un id nuevo, refrescar y
        // salir al listado para evitar inconsistencias de routing.
        void newId
        onBack()
      },
      onCommit: async () => {
        try {
          await deleteClient(clientId)
          setSoftDeletedClientId(null)
          onBack()
        } catch {
          setSoftDeletedClientId(null)
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="text-center text-graphite/60 py-12">
        {t('common.loading')}
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-graphite/70">{t('history.notFound')}</p>
        <Button variant="outline" onClick={onBack} fullWidth>
          {t('admin.actions.back')}
        </Button>
      </div>
    )
  }

  const name = fullNameOf(client)
  const lastVisit = records[0]?.date
  const isSoftDeleted = softDeletedClientId === clientId
  const recordCount = records.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-graphite">{name}</h1>
        <p className="text-xs text-graphite/60">
          {t('admin.detail.clientCreated', {
            date: formatRecordDate(client.createdAt, t),
          })}
          {lastVisit && (
            <>
              {' · '}
              {t('admin.detail.lastVisit', {
                date: formatRecordDate(lastVisit, t),
              })}
            </>
          )}
        </p>
      </div>

      <section
        className={`rounded-2xl border border-divider bg-white p-5 transition-opacity ${
          isSoftDeleted ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-semibold text-graphite">
            {t('admin.detail.dataTitle')}
          </h2>
          <Button
            type="button"
            size="sm"
            onClick={() => setEditClientOpen(true)}
            disabled={isSoftDeleted}
            className="!bg-info hover:!bg-info-dark"
          >
            {t('admin.detail.editClient')}
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <DataPair
            label={`${t('basicForm.fields.age.label')} / ${t(
              'basicForm.fields.heightCm.label',
            )}`}
            value={`${client.age} ${t('basicForm.fields.age.autoCalculated', {
              years: 1,
            }).replace('1', '').trim()} · ${client.heightCm} cm`}
          />
          <DataPair
            label={`${t('basicForm.fields.gender.label')} / ${t(
              'basicForm.fields.wristContexture.label',
            )}`}
            value={`${
              client.gender === 'F'
                ? t('basicForm.fields.gender.options.F')
                : t('basicForm.fields.gender.options.M')
            } · ${
              client.wristContexture === 'thin'
                ? t('basicForm.fields.wristContexture.options.thin')
                : client.wristContexture === 'thick'
                  ? t('basicForm.fields.wristContexture.options.thick')
                  : t('basicForm.fields.wristContexture.options.normal')
            }`}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-divider bg-white p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="font-semibold text-graphite">
            {t('admin.detail.recordsTitle')}
          </h2>
          <span className="text-xs text-graphite/50">
            {recordCount}{' '}
            {t('admin.clientCard.recordCount', { count: recordCount }).replace(
              /^\d+\s/,
              '',
            )}
          </span>
        </div>
        {recordCount === 0 ? (
          <p className="text-sm text-graphite/60 text-center py-4">
            {t('admin.detail.noRecords')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {records.map((rec) => {
              return (
                <li
                  key={rec.id}
                  className="rounded-xl border border-divider p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-graphite">
                      {formatRecordDate(rec.date, t)}
                    </p>
                    <p className="text-xs text-graphite/60">
                      {rec.weight} kg · IMC {rec.bmi} · {rec.bodyFatPct}% grasa
                    </p>
                    {rec.notes && (
                      <p className="text-xs text-graphite/70 mt-1 italic">
                        “{rec.notes}”
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setEditRecord(rec)}
                      className="!bg-info hover:!bg-info-dark"
                    >
                      {t('admin.actions.edit')}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRecord(rec)}
                    >
                      {t('admin.actions.delete')}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Button
        type="button"
        variant="destructive"
        size="md"
        onClick={() => setDeleteClientOpen(true)}
        fullWidth
        disabled={isSoftDeleted}
      >
        {t('admin.detail.deleteClient')}
      </Button>

      <div className="pt-2">
        <Button variant="outline" onClick={onBack} fullWidth>
          {t('admin.actions.back')}
        </Button>
      </div>

      {editClientOpen && (
        <EditClientModal
          client={client}
          onClose={() => setEditClientOpen(false)}
          onSaved={handleClientSaved}
          updateClient={updateClient as (id: number, input: Omit<CreateClientInput, 'age'>) => Promise<void>}
        />
      )}

      {editRecord && editRecord.id != null && (
        <EditRecordModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={handleRecordSaved}
          updateRecord={updateRecord as (id: number, input: CreateRecordInput) => Promise<void>}
        />
      )}

      {deleteClientOpen && (
        <DeleteClientDialog
          client={client}
          recordCount={recordCount}
          onCancel={() => setDeleteClientOpen(false)}
          onConfirm={handleDeleteClient}
        />
      )}
    </div>
  )
}

function DataPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-graphite/50">{label}</dt>
      <dd className="text-sm text-graphite mt-0.5">{value}</dd>
    </div>
  )
}

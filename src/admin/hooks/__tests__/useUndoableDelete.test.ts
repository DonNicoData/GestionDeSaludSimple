import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  UNDO_WINDOW_MS,
  useUndoableDelete,
} from '../useUndoableDelete'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useUndoableDelete', () => {
  it('empieza en idle', () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number; name: string }>({
        commit,
        restore,
        snapshot: { id: 1, name: 'Juan' },
      }),
    )
    expect(result.current.state.kind).toBe('idle')
    expect(commit).not.toHaveBeenCalled()
  })

  it('trigger() pasa a pending y muestra remainingMs', () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number }>({
        commit,
        restore,
        snapshot: { id: 1 },
      }),
    )

    act(() => {
      result.current.trigger()
    })
    expect(result.current.state.kind).toBe('pending')
    expect(result.current.remainingMs).toBeGreaterThan(0)
  })

  it('commit se llama tras UNDO_WINDOW_MS si no hubo undo', async () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const onCommitted = vi.fn()
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number }>({
        commit,
        restore,
        snapshot: { id: 1 },
        onCommitted,
      }),
    )

    act(() => {
      result.current.trigger()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    })

    expect(commit).toHaveBeenCalledTimes(1)
    expect(restore).not.toHaveBeenCalled()
    expect(onCommitted).toHaveBeenCalledTimes(1)
    expect(result.current.state.kind).toBe('committed')
  })

  it('undo() dentro de la ventana cancela el commit y llama a restore', async () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const onUndone = vi.fn()
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number }>({
        commit,
        restore,
        snapshot: { id: 1 },
        onUndone,
      }),
    )

    act(() => {
      result.current.trigger()
    })

    // Solo pasaron 2s, dentro de la ventana de 5s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
      await result.current.undo()
    })

    // Tras undo, NO debe haberse llamado a commit.
    expect(commit).not.toHaveBeenCalled()
    expect(restore).toHaveBeenCalledWith({ id: 1 })
    expect(onUndone).toHaveBeenCalledTimes(1)
    expect(result.current.state.kind).toBe('restored')

    // Aún avanzando más tiempo, commit sigue sin llamarse.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    })
    expect(commit).not.toHaveBeenCalled()
  })

  it('cancel() aborta el timer y vuelve a idle', async () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number }>({
        commit,
        restore,
        snapshot: { id: 1 },
      }),
    )

    act(() => {
      result.current.trigger()
      result.current.cancel()
    })

    expect(result.current.state.kind).toBe('idle')
    expect(result.current.remainingMs).toBe(0)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    })
    expect(commit).not.toHaveBeenCalled()
  })

  it('trigger() sobreescribe un pending previo (cancelando el commit del primero)', async () => {
    const commit = vi.fn().mockResolvedValue(undefined)
    const restore = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useUndoableDelete<{ id: number }>({
        commit,
        restore,
        snapshot: { id: 1 },
      }),
    )

    act(() => {
      result.current.trigger()
    })
    act(() => {
      result.current.trigger()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS)
    })

    // commit se llama una sola vez (el del segundo trigger).
    expect(commit).toHaveBeenCalledTimes(1)
  })
})

import { useState, useEffect, useCallback } from 'react'
import * as slotsApi from '../api/adminSlotsApi'
import { getErrorCode } from '../model/errors'

const INITIAL = { roomId: null, slots: [], loadError: null }

export function useAdminSlots(roomId) {
  const [state, setState] = useState(INITIAL)

  const refresh = useCallback(async () => {
    try {
      const slots = await slotsApi.fetchSlots(roomId)
      setState({ roomId, slots, loadError: null })
    } catch (err) {
      setState((prev) => ({
        roomId,
        slots: prev.roomId === roomId ? prev.slots : [],
        loadError: getErrorCode(err),
      }))
    }
  }, [roomId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const run = useCallback(
    async (action) => {
      try {
        const data = await action()
        await refresh()
        return { success: true, data }
      } catch (err) {
        return { success: false, error: getErrorCode(err) }
      }
    },
    [refresh],
  )

  return {
    slots: state.slots,
    // Cargando mientras los datos guardados no son de la sala actual
    loading: state.roomId !== roomId,
    loadError: state.loadError,
    refresh,
    createSlot: (form) => run(() => slotsApi.createSlot(roomId, form)),
    updateSlot: (id, form) => run(() => slotsApi.updateSlot(id, form)),
    setBlocked: (id, blocked) =>
      run(() => slotsApi.setSlotStatus(id, blocked ? 'blocked' : 'available')),
    generateSlots: (payload) => run(() => slotsApi.generateSlots(roomId, payload)),
    deleteSlot: (id) => run(() => slotsApi.deleteSlot(id)),
  }
}

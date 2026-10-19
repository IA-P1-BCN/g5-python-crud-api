import { useCallback, useEffect, useState } from 'react'
import { mapApiError } from '@/shared/api/errors.js'
import { adminRoomsApi } from '../api/adminRoomsApi'

// One page of rooms. `loading` is derived (the stored result belongs to another page/reload),
// so no state is set synchronously inside the effect.
export function useAdminRooms() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const key = `${page}:${reloadKey}`

  useEffect(() => {
    let cancelled = false
    adminRoomsApi
      .getRooms(page)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((err) => !cancelled && setResult({ key, data: null, error: mapApiError(err).message }))
    return () => {
      cancelled = true
    }
  }, [page, key])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const saveRoom = async (roomData) => {
    const room = await adminRoomsApi.createRoom(roomData)
    reload()
    return room
  }

  const toggleActive = async (id, active) => {
    const updated = await adminRoomsApi.toggleRoomActive(id, active)
    setResult((prev) => ({
      ...prev,
      data: prev.data && {
        ...prev.data,
        items: prev.data.items.map((r) => (r.id === id ? updated : r)),
      },
    }))
    return updated
  }

  return {
    rooms: result.data?.items ?? [],
    total: result.data?.total ?? 0,
    size: result.data?.size ?? 20,
    page,
    setPage,
    loading: result.key !== key,
    error: result.key === key ? result.error : null,
    saveRoom,
    toggleActive,
  }
}

export default useAdminRooms

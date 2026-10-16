import { useState, useEffect, useCallback } from 'react'
import { adminRoomsApi } from '../api/adminRoomsApi'

export function useAdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshRooms = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminRoomsApi.getRooms()
      setRooms(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    adminRoomsApi
      .getRooms()
      .then((data) => {
        if (cancelled) return
        setRooms(data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const saveRoom = async (roomData) => {
    const newRoom = await adminRoomsApi.createRoom(roomData)
    setRooms((prev) => [...prev, newRoom])
    return newRoom
  }

  const toggleActive = async (id, active) => {
    const updated = await adminRoomsApi.toggleRoomActive(id, active)
    setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }

  return {
    rooms,
    loading,
    error,
    saveRoom,
    toggleActive,
    refreshRooms,
  }
}

export default useAdminRooms

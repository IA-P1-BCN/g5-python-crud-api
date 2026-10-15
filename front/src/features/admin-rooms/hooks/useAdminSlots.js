import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/adminSlotsApi';

export function useAdminSlots(roomId) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSlots = useCallback(async () => {
    try {
      const data = await api.fetchSlots(roomId);
      setSlots(data);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [roomId]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      try {
        const data = await api.fetchSlots(roomId);
        if (isMounted) {
          setSlots(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const handleCreate = async (data) => {
    try {
      await api.createSlot(roomId, data);
      await loadSlots();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const handleUpdate = async (slotId, data) => {
    try {
      await api.updateSlot(roomId, slotId, data);
      await loadSlots();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const handleDelete = async (slotId) => {
    try {
      await api.deleteSlot(roomId, slotId);
      await loadSlots();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  return { slots, loading, error, createSlot: handleCreate, updateSlot: handleUpdate, deleteSlot: handleDelete, refresh: loadSlots };
}
// Zustand store: booking in progress (room, day, slot, players). Client state only.
import { create } from 'zustand'

export const useBookingDraftStore = create((set) => ({
  selectedDate: null,
  selectedSlot: null,
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  reset: () => set({ selectedDate: null, selectedSlot: null }),
}))

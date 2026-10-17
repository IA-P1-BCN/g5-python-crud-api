// Zustand store: booking in progress (room, day, slot, players, client). Client state only.
import { create } from 'zustand'

const initialState = {
  selectedDate: null,
  selectedSlot: null,
  players: 1,
  slotId: null,
  clientDetails: { name: '', email: '', phone: '' },
  currentStep: 1,
}

export const useBookingDraftStore = create((set) => ({
  ...initialState,

  // Comportamiento original de develop: cambiar de día borra el slot elegido
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null, slotId: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot, slotId: slot?.id ?? null }),
  setPlayers: (players) => set({ players }),

  // Flujo de checkout
  setSlotId: (slotId) => set({ slotId }),
  setClientDetails: (details) =>
    set((state) => ({ clientDetails: { ...state.clientDetails, ...details } })),
  setStep: (step) => set({ currentStep: step }),

  reset: () => set(initialState),
  resetDraft: () => set(initialState),
}))

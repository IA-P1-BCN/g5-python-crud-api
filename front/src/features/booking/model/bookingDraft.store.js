// Zustand store: booking in progress (room, day, slot, players, client). Client state only.
import { create } from 'zustand'

const initialState = {
  roomSlug: null,
  selectedDate: null,
  selectedSlot: null,
  players: 1,
  slotId: null,
  currentStep: 1,
}

export const useBookingDraftStore = create((set, get) => ({
  ...initialState,

  // Comportamiento original de develop: cambiar de día borra el slot elegido
  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null, slotId: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot, slotId: slot?.id ?? null }),
  setPlayers: (players) => set({ players }),
  setRoomSlug: (roomSlug) => set({ roomSlug }),
  // The draft belongs to one room: opening another room starts from a clean draft.
  startRoom: (roomSlug) => {
    if (get().roomSlug !== roomSlug) set({ ...initialState, roomSlug })
  },

  // Flujo de checkout
  setSlotId: (slotId) => set({ slotId }),
  setStep: (step) => set({ currentStep: step }),

  reset: () => set(initialState),
  resetDraft: () => set(initialState),
}))

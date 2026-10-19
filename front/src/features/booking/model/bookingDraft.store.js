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

  setSelectedDate: (date) => set({ selectedDate: date, selectedSlot: null, slotId: null }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot, slotId: slot?.id ?? null }),
  setPlayers: (players) => set({ players }),
  setRoomSlug: (roomSlug) => set({ roomSlug }),
  startRoom: (roomSlug) => {
    if (get().roomSlug !== roomSlug) set({ ...initialState, roomSlug })
  },

  setSlotId: (slotId) => set({ slotId }),
  setStep: (step) => set({ currentStep: step }),

  reset: () => set(initialState),
  resetDraft: () => set(initialState),
}))

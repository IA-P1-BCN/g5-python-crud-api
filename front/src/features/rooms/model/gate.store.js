import { create } from 'zustand'

export const useGateStore = create((set) => ({
  room: null,
  phase: null,
  start: (room) => set({ room, phase: 'cover' }),
  uncover: () => set({ phase: 'uncover' }),
  reset: () => set({ room: null, phase: null }),
}))

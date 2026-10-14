// Which room's gate is playing, and in which half. Lives above the routes so the gate
// survives the page change: cover -> (navigate) -> uncover.
import { create } from 'zustand'

export const useGateStore = create((set) => ({
  room: null,
  phase: null, // null | 'cover' | 'uncover'
  start: (room) => set({ room, phase: 'cover' }),
  uncover: () => set({ phase: 'uncover' }),
  reset: () => set({ room: null, phase: null }),
}))

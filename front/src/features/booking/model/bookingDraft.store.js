import { create } from 'zustand';

const initialState = {
  slotId: null,
  clientDetails: {
    name: '',
    email: '',
    phone: '',
  },
  currentStep: 1,
};

export const useBookingDraftStore = create((set) => ({
  ...initialState,
  
  setSlotId: (slotId) => set({ slotId }),
  
  setClientDetails: (details) => 
    set((state) => ({
      clientDetails: { ...state.clientDetails, ...details },
    })),
    
  setStep: (step) => set({ currentStep: step }),
  
  resetDraft: () => set(initialState),
}));
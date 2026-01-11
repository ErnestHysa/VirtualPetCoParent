import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PetSpecies = 'dragon' | 'cat' | 'fox' | 'puppy';
export type PetColor = 'rose' | 'lavender' | 'sky' | 'mint' | 'sunset' | 'ocean';

interface OnboardingState {
  currentStep: number;
  petSpecies: PetSpecies | null;
  petColor: PetColor | null;
  petName: string;
  displayName: string;
  userEmail: string;
  pairingCode: string | null;

  setSpecies: (species: PetSpecies) => void;
  setColor: (color: PetColor) => void;
  setPetName: (name: string) => void;
  setDisplayName: (name: string) => void;
  setUserEmail: (email: string) => void;
  setPairingCode: (code: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  petSpecies: null,
  petColor: null,
  petName: '',
  displayName: '',
  userEmail: '',
  pairingCode: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setSpecies: (species) => set({ petSpecies: species }),
      setColor: (color) => set({ petColor: color }),
      setPetName: (name) => set({ petName: name }),
      setDisplayName: (name) => set({ displayName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      setPairingCode: (code) => set({ pairingCode: code }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);

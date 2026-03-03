import { create } from 'zustand';
import { personaLibrary } from '../constants/personas';
import { PersonaProfile } from '../types/persona';

export interface PersonaState {
  personas: PersonaProfile[];
  active: PersonaProfile;
  setActive: (id: PersonaProfile['id']) => void;
}

export const usePersonaStore = create<PersonaState>((set) => ({
  personas: personaLibrary,
  active: personaLibrary[0],
  setActive: (id) =>
    set((state) => ({
      active: state.personas.find((persona) => persona.id === id) ?? state.active,
    })),
}));


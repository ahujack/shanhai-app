import { create } from 'zustand';
import { DivinationResult, FortuneSlip } from '../services/api';

interface DivinationStore {
  lastFortune: FortuneSlip | null;
  lastReading: DivinationResult | null;
  setLastFortune: (fortune: FortuneSlip | null) => void;
  setLastReading: (reading: DivinationResult | null) => void;
  clearLastFortune: () => void;
  clearLastReading: () => void;
}

export const useDivinationStore = create<DivinationStore>((set) => ({
  lastFortune: null,
  lastReading: null,
  setLastFortune: (fortune) => set({ lastFortune: fortune }),
  setLastReading: (reading) => set({ lastReading: reading }),
  clearLastFortune: () => set({ lastFortune: null }),
  clearLastReading: () => set({ lastReading: null }),
}));

import { create } from 'zustand';
import { FortuneSlip } from '../services/api';

interface DivinationStore {
  lastFortune: FortuneSlip | null;
  setLastFortune: (fortune: FortuneSlip | null) => void;
  clearLastFortune: () => void;
}

export const useDivinationStore = create<DivinationStore>((set) => ({
  lastFortune: null,
  setLastFortune: (fortune) => set({ lastFortune: fortune }),
  clearLastFortune: () => set({ lastFortune: null }),
}));

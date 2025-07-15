import { create } from 'zustand';
import type { EmissionActivity, CarbonCredit, DashboardStats } from '../types';

interface AppState {
  emissions: EmissionActivity[];
  credits: CarbonCredit[];
  dashboardStats: DashboardStats | null;
  setEmissions: (emissions: EmissionActivity[]) => void;
  addEmission: (emission: EmissionActivity) => void;
  setCredits: (credits: CarbonCredit[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
}

export const useAppStore = create<AppState>((set) => ({
  emissions: [],
  credits: [],
  dashboardStats: null,
  setEmissions: (emissions) => set({ emissions }),
  addEmission: (emission) => set((state) => ({ 
    emissions: [...state.emissions, emission] 
  })),
  setCredits: (credits) => set({ credits }),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
}));

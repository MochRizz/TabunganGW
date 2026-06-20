import { create } from 'zustand'

export type TabType = 'dashboard' | 'riwayat' | 'laporan' | 'tambah'

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
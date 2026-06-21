import { create } from 'zustand'

export type TabType = 'dashboard' | 'riwayat' | 'laporan' | 'tambah' | 'pengaturan' | 'admin'

export interface AppUser {
  id: string
  name: string
  role: string
}

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  user: AppUser | null
  setUser: (user: AppUser | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  user: null,
  setUser: (user) => set({ user }),
}))
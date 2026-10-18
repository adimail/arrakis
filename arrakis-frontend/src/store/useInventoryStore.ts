import { create } from 'zustand'
import { ProductResponse } from '../types/inventory'

interface InventoryState {
  activeTab: 'home' | 'settings'
  setActiveTab: (tab: 'home' | 'settings') => void

  page: number
  setPage: (page: number) => void

  locationId: string
  setLocationId: (id: string) => void

  threshold: number
  setThreshold: (threshold: number) => void

  lastSynced: string | null
  setLastSynced: (timestamp: string) => void

  selectedProduct: ProductResponse | null
  setSelectedProduct: (product: ProductResponse | null) => void

  isVariantModalOpen: boolean
  setIsVariantModalOpen: (open: boolean) => void

  isSyncModalOpen: boolean
  setIsSyncModalOpen: (open: boolean) => void
}

export const useInventoryStore = create<InventoryState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  page: 0,
  setPage: (page) => set({ page }),

  locationId: 'ALL',
  setLocationId: (locationId) => set({ locationId, page: 0 }),

  threshold: (() => {
    const saved = localStorage.getItem('low_inventory_threshold')
    return saved ? parseInt(saved, 10) : 10
  })(),
  setThreshold: (threshold) => {
    localStorage.setItem('low_inventory_threshold', threshold.toString())
    set({ threshold, activeTab: 'home' })
  },

  lastSynced: localStorage.getItem('last_synced_at'),
  setLastSynced: (lastSynced) => {
    localStorage.setItem('last_synced_at', lastSynced)
    set({ lastSynced })
  },

  selectedProduct: null,
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

  isVariantModalOpen: false,
  setIsVariantModalOpen: (isVariantModalOpen) => set({ isVariantModalOpen }),

  isSyncModalOpen: false,
  setIsSyncModalOpen: (isSyncModalOpen) => set({ isSyncModalOpen }),
}))

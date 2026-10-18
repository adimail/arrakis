import { create } from 'zustand'
import type { ProductResponse } from '../api/inventory'
import { ALL_LOCATIONS_KEY, DEFAULT_TAB } from '../lib/constants'

export type ActiveTab = 'home' | 'settings'

interface InventoryState {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void

  page: number
  setPage: (page: number) => void

  locationId: string
  setLocationId: (id: string) => void

  lowStockOnly: boolean
  setLowStockOnly: (val: boolean) => void

  selectedProduct: ProductResponse | null
  setSelectedProduct: (product: ProductResponse | null) => void

  isVariantModalOpen: boolean
  setIsVariantModalOpen: (open: boolean) => void

  isSyncModalOpen: boolean
  setIsSyncModalOpen: (open: boolean) => void

  syncFromUrl: () => void
}

function getInitialUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const tabParam = params.get('tab')
  const activeTab: ActiveTab = tabParam === 'settings' ? 'settings' : (DEFAULT_TAB as ActiveTab)
  const pageParsed = parseInt(params.get('page') || '1', 10)
  const page = isNaN(pageParsed) || pageParsed < 1 ? 1 : pageParsed
  const locationId = params.get('locationId') || ALL_LOCATIONS_KEY
  const lowStockOnly = params.get('lowStockOnly') === 'true'

  return { activeTab, page, locationId, lowStockOnly }
}

function syncToUrl(tab: ActiveTab, page: number, locationId: string, lowStockOnly: boolean) {
  const params = new URLSearchParams()
  if (tab !== DEFAULT_TAB) params.set('tab', tab)
  if (page > 1) params.set('page', page.toString())
  if (locationId !== ALL_LOCATIONS_KEY) params.set('locationId', locationId)
  if (lowStockOnly) params.set('lowStockOnly', 'true')

  const queryString = params.toString()
  const newUrl = `${window.location.pathname}${queryString ? '?' + queryString : ''}`
  window.history.pushState({}, '', newUrl)
}

const initial = getInitialUrlParams()

export const useInventoryStore = create<InventoryState>((set, get) => ({
  activeTab: initial.activeTab,
  setActiveTab: (activeTab) => {
    set({ activeTab })
    syncToUrl(activeTab, get().page, get().locationId, get().lowStockOnly)
  },

  page: initial.page,
  setPage: (page) => {
    const validPage = Math.max(1, page)
    set({ page: validPage })
    syncToUrl(get().activeTab, validPage, get().locationId, get().lowStockOnly)
  },

  locationId: initial.locationId,
  setLocationId: (locationId) => {
    set({ locationId, page: 1 })
    syncToUrl(get().activeTab, 1, locationId, get().lowStockOnly)
  },

  lowStockOnly: initial.lowStockOnly,
  setLowStockOnly: (lowStockOnly) => {
    set({ lowStockOnly, page: 1 })
    syncToUrl(get().activeTab, 1, get().locationId, lowStockOnly)
  },

  selectedProduct: null,
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),

  isVariantModalOpen: false,
  setIsVariantModalOpen: (isVariantModalOpen) => set({ isVariantModalOpen }),

  isSyncModalOpen: false,
  setIsSyncModalOpen: (isSyncModalOpen) => set({ isSyncModalOpen }),

  syncFromUrl: () => {
    const next = getInitialUrlParams()
    set({
      activeTab: next.activeTab,
      page: next.page,
      locationId: next.locationId,
      lowStockOnly: next.lowStockOnly,
    })
  },
}))

import { useInventoryStore, type ActiveTab } from '../store/useInventoryStore'

export type { ActiveTab }

export function useInventoryFilters() {
  const activeTab = useInventoryStore((state) => state.activeTab)
  const setActiveTab = useInventoryStore((state) => state.setActiveTab)
  const page = useInventoryStore((state) => state.page)
  const setPage = useInventoryStore((state) => state.setPage)
  const locationId = useInventoryStore((state) => state.locationId)
  const setLocationId = useInventoryStore((state) => state.setLocationId)
  const lowStockOnly = useInventoryStore((state) => state.lowStockOnly)
  const setLowStockOnly = useInventoryStore((state) => state.setLowStockOnly)

  return {
    activeTab,
    setActiveTab,
    page,
    setPage,
    locationId,
    setLocationId,
    lowStockOnly,
    setLowStockOnly,
  }
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { fetchProducts, fetchLocations, syncInventory } from './api/inventory'
import { ShopifyHeader } from './components/layout/ShopifyHeader'
import { ShopifySidebar } from './components/layout/ShopifySidebar'
import { ProductTable } from './components/inventory/ProductTable'
import { VariantModal } from './components/inventory/VariantModal'
import { SyncModal } from './components/inventory/SyncModal'
import { ThresholdSettings } from './components/settings/ThresholdSettings'
import { ProductResponse } from './types/inventory'

export default function App() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home')
  const [page, setPage] = useState<number>(0)
  const [locationId, setLocationId] = useState<string>('ALL')
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('low_inventory_threshold')
    return saved ? parseInt(saved, 10) : 10
  })
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('last_synced_at')
  })
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState<boolean>(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false)

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  })

  const { data: productPage, isLoading } = useQuery({
    queryKey: ['products', page, locationId, threshold],
    queryFn: () => fetchProducts(page, locationId, threshold),
  })

  const syncMutation = useMutation({
    mutationFn: syncInventory,
    onSuccess: (data) => {
      const now = data.syncedAt || new Date().toISOString()
      localStorage.setItem('last_synced_at', now)
      setLastSynced(now)
      setIsSyncModalOpen(false)
      message.success(`Synchronized ${data.syncedProductsCount} products from Shopify`)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
    onError: () => {
      message.error('Failed to sync inventory with Shopify')
    },
  })

  const handleRowClick = (product: ProductResponse) => {
    setSelectedProduct(product)
    setIsVariantModalOpen(true)
  }

  const handleSaveThreshold = (newThreshold: number) => {
    setThreshold(newThreshold)
    localStorage.setItem('low_inventory_threshold', newThreshold.toString())
    setActiveTab('home')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f2f4' }}>
      <ShopifyHeader
        locations={locations}
        selectedLocation={locationId}
        onLocationChange={(val) => {
          setLocationId(val)
          setPage(0)
        }}
        onOpenSync={() => setIsSyncModalOpen(true)}
        isSyncing={syncMutation.isPending}
      />

      <div className="shopify-app-layout" style={{ display: 'flex', flex: 1 }}>
        <ShopifySidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="shopify-main-content" style={{ flex: 1, padding: '24px 32px' }}>
          {activeTab === 'home' ? (
            <div>
              <ProductTable
                products={productPage?.content || []}
                loading={isLoading}
                total={productPage?.totalElements || 0}
                currentPage={page}
                onPageChange={setPage}
                onRowClick={handleRowClick}
              />

              <VariantModal
                product={selectedProduct}
                visible={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                threshold={threshold}
              />
            </div>
          ) : (
            <ThresholdSettings
              initialThreshold={threshold}
              onSave={handleSaveThreshold}
            />
          )}
        </main>
      </div>

      <SyncModal
        open={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
        lastSynced={lastSynced}
      />
    </div>
  )
}

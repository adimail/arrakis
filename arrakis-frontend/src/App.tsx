import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { fetchProducts, fetchLocations, syncInventory } from './api/inventory'
import { FilterHeader } from './components/FilterHeader'
import { ProductTable } from './components/ProductTable'
import { VariantModal } from './components/VariantModal'
import { ProductResponse } from './types/inventory'

export default function App() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState<number>(0)
  const [locationId, setLocationId] = useState<string>('ALL')
  const [threshold, setThreshold] = useState<number>(10)
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

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
    setIsModalOpen(true)
  }

  return (
    <div style={{ maxWidth: 1140, margin: '32px auto', padding: '0 16px' }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#008060', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
          S
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#202223' }}>Arrakis Low Inventory Alert Dashboard</h1>
          <p style={{ margin: 0, color: '#6d7175', fontSize: 13 }}>Shopify Multi-Location Stock Tracking</p>
        </div>
      </header>

      <FilterHeader
        locations={locations}
        selectedLocation={locationId}
        onLocationChange={(val) => {
          setLocationId(val)
          setPage(0)
        }}
        threshold={threshold}
        onThresholdChange={setThreshold}
        onSync={() => syncMutation.mutate()}
        isSyncing={syncMutation.isPending}
      />

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
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        threshold={threshold}
      />
    </div>
  )
}

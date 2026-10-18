import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, notification } from 'antd'
import { ShopifyHeader } from './components/layout/ShopifyHeader'
import { ShopifySidebar } from './components/layout/ShopifySidebar'
import { ProductTable } from './components/inventory/ProductTable'
import { VariantModal } from './components/inventory/VariantModal'
import { SyncModal } from './components/inventory/SyncModal'
import { ThresholdSettings } from './components/settings/ThresholdSettings'
import { checkHealth } from './api/inventory'
import { useInventoryStore } from './store/useInventoryStore'

export default function App() {
  const queryClient = useQueryClient()
  const activeTab = useInventoryStore((state) => state.activeTab)

  const { data: health, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 15000,
    retry: 1,
  })

  const isNominal = !isError && health?.status === 'UP'

  useEffect(() => {
    const handlePopState = () => {
      useInventoryStore.getState().syncFromUrl()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const eventSource = new EventSource('/api/inventory/stream')

    eventSource.addEventListener('stock-update', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        const timeString = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['metrics'] })
        queryClient.invalidateQueries({ queryKey: ['customVariants'] })

        notification.warning({
          message: 'Real-Time Inventory Alert',
          description: (
            <div>
              <div>
                {data.productTitle} ({data.variantTitle}) stock updated to <strong>{data.newQuantity}</strong> units.
              </div>
              <div style={{ fontSize: 11, color: '#8c9196', marginTop: 6 }}>
                Updated at {timeString}
              </div>
            </div>
          ),
          duration: 0,
          key: `stock-${data.variantId}-${Date.now()}`,
          placement: 'topRight',
        })
      } catch (err) {
        console.error(err)
      }
    })

    return () => {
      eventSource.close()
    }
  }, [queryClient])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f2f4' }}>
      <ShopifyHeader />

      <div className="shopify-app-layout" style={{ display: 'flex', flex: 1 }}>
        <ShopifySidebar />

        <main className="shopify-main-content" style={{ flex: 1, padding: '24px 32px' }}>
          {!isNominal && (
            <Alert
              type="error"
              showIcon
              message="Backend Service Unreachable"
              description="Unable to reach the Arrakis inventory service. Live synchronization, updates, and metrics are paused until connectivity is restored."
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          {activeTab === 'home' ? <ProductTable /> : <ThresholdSettings />}
        </main>
      </div>

      <VariantModal />
      <SyncModal />
    </div>
  )
}

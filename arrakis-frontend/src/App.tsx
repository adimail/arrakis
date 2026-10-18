import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShopifyHeader } from './components/layout/ShopifyHeader'
import { ShopifySidebar } from './components/layout/ShopifySidebar'
import { ProductTable } from './components/inventory/ProductTable'
import { VariantModal } from './components/inventory/VariantModal'
import { SyncModal } from './components/inventory/SyncModal'
import { ThresholdSettings } from './components/settings/ThresholdSettings'
import { fetchSettings } from './api/inventory'
import { useInventoryStore } from './store/useInventoryStore'

export default function App() {
  const activeTab = useInventoryStore((state) => state.activeTab)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  useEffect(() => {
    if (settings?.threshold !== undefined) {
      useInventoryStore.setState({ threshold: settings.threshold })
    }
  }, [settings])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f2f4' }}>
      <ShopifyHeader />

      <div className="shopify-app-layout" style={{ display: 'flex', flex: 1 }}>
        <ShopifySidebar />

        <main className="shopify-main-content" style={{ flex: 1, padding: '24px 32px' }}>
          {activeTab === 'home' ? <ProductTable /> : <ThresholdSettings />}
        </main>
      </div>

      <VariantModal />
      <SyncModal />
    </div>
  )
}

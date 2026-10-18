import React, { useState } from 'react'
import { Select, Avatar, Typography, ConfigProvider, theme, Button } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { useQuery, useIsMutating } from '@tanstack/react-query'
import { fetchLocations } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Text } = Typography

export const ShopifyHeader: React.FC = () => {
  const [imgError, setImgError] = useState(false)

  const locationId = useInventoryStore((state) => state.locationId)
  const setLocationId = useInventoryStore((state) => state.setLocationId)
  const setIsSyncModalOpen = useInventoryStore((state) => state.setIsSyncModalOpen)

  const isSyncing = useIsMutating({ mutationKey: ['syncInventory'] }) > 0

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  })

  const locationOptions = [
    { value: 'ALL', label: 'All Locations' },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ]

  const getInitials = (name: string) => {
    if (!name || name === 'ALL') return 'AL'
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  const selectedLocationName =
    locationId === 'ALL'
      ? 'All Locations'
      : locations.find((l) => l.id === locationId)?.name || 'All Locations'

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: '#202020',
          colorBorder: 'transparent',
          colorText: '#ffffff',
          colorTextPlaceholder: '#8c8c8c',
          controlOutline: 'transparent',
          borderRadius: 8,
        },
        components: {
          Select: {
            selectorBg: 'transparent',
            colorBorder: 'transparent',
            colorPrimaryHover: 'transparent',
            colorText: '#ffffff',
            optionSelectedBg: '#0e6245',
            optionSelectedColor: '#ffffff',
          },
        },
      }}
    >
      <header
        className="shopify-header"
        style={{
          backgroundColor: '#1a1a1a',
          minHeight: 52,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #303030',
          zIndex: 100,
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!imgError ? (
            <img
              src="/logo.svg"
              alt="Arrakis Logo"
              onError={() => setImgError(true)}
              style={{ width: 26, height: 26, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: '#008060',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              A
            </div>
          )}
          <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 15, letterSpacing: -0.2 }}>
            Arrakis Inventory
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button
            className="shopify-header-sync-btn"
            icon={<SyncOutlined spin={isSyncing} />}
            onClick={() => setIsSyncModalOpen(true)}
          >
            <span className="shopify-header-sync-text">Sync</span>
          </Button>

          <div
            className="shopify-header-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#262626',
              borderRadius: 22,
              padding: '3px 12px 3px 6px',
              gap: 6,
              border: '1px solid #363636',
              position: 'relative',
            }}
          >
            <Avatar
              size={28}
              className="shopify-header-avatar"
              style={{
                backgroundColor: '#b85d77',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {getInitials(selectedLocationName)}
            </Avatar>

            <Select
              variant="borderless"
              className="shopify-header-location-select"
              value={locationId}
              onChange={setLocationId}
              options={locationOptions}
              size="small"
              style={{ minWidth: 160 }}
              popupMatchSelectWidth={false}
              dropdownStyle={{ minWidth: 220 }}
            />
          </div>
        </div>
      </header>
    </ConfigProvider>
  )
}

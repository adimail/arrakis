import React from 'react'
import { HomeOutlined, SettingOutlined } from '@ant-design/icons'
import { Badge, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { checkHealth } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Text } = Typography

export const ShopifySidebar: React.FC = () => {
  const activeTab = useInventoryStore((state) => state.activeTab)
  const setActiveTab = useInventoryStore((state) => state.setActiveTab)

  const { data: health, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: 15000,
    retry: 1,
  })

  const isNominal = !isError && health?.status === 'UP'

  return (
    <aside
      className="shopify-sidebar"
      style={{
        width: 200,
        backgroundColor: '#f7f7f7',
        borderRight: '1px solid #e1e3e5',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 52,
        height: 'calc(100vh - 52px)',
        alignSelf: 'flex-start',
        padding: '16px 10px',
        flexShrink: 0,
      }}
    >
      <div
        className="shopify-sidebar-nav"
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <button
          className="shopify-sidebar-btn"
          onClick={() => setActiveTab('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: activeTab === 'home' ? '#ffffff' : 'transparent',
            boxShadow: activeTab === 'home' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            color: activeTab === 'home' ? '#008060' : '#4a4a4a',
            fontWeight: activeTab === 'home' ? 600 : 500,
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <HomeOutlined style={{ fontSize: 16 }} />
          Home
        </button>

        <button
          className="shopify-sidebar-btn"
          onClick={() => setActiveTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: activeTab === 'settings' ? '#ffffff' : 'transparent',
            boxShadow: activeTab === 'settings' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            color: activeTab === 'settings' ? '#008060' : '#4a4a4a',
            fontWeight: activeTab === 'settings' ? 600 : 500,
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <SettingOutlined style={{ fontSize: 16 }} />
          Settings
        </button>
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '10px 12px',
          borderTop: '1px solid #e1e3e5',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Badge status={isNominal ? 'success' : 'error'} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text style={{ fontSize: 11, color: '#6d7175', lineHeight: 1.2 }}>Backend</Text>
          <Text strong style={{ fontSize: 12, color: isNominal ? '#0e6245' : '#d72c0d', lineHeight: 1.2 }}>
            {isNominal ? 'Nominal' : 'Offline'}
          </Text>
        </div>
      </div>
    </aside>
  )
}

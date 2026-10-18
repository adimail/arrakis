import React from 'react'
import { Typography, Spin, Tabs, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { fetchSettings, fetchCustomThresholdVariants } from '../../api/inventory'
import { StoreWideAlertCard } from './StoreWideAlertCard'
import { VariantOverridesTable } from './VariantOverridesTable'

const { Title, Text } = Typography

export const ThresholdSettings: React.FC = () => {
  const { isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const { data: customVariants = [] } = useQuery({
    queryKey: ['customVariants'],
    queryFn: fetchCustomThresholdVariants,
  })

  if (isSettingsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const items = [
    {
      key: 'store-wide',
      label: (
        <span style={{ fontSize: 13, fontWeight: 500, padding: '0 4px' }}>
          Store-Wide Alert
        </span>
      ),
      children: <StoreWideAlertCard />,
    },
    {
      key: 'variant-overrides',
      label: (
        <span style={{ fontSize: 13, fontWeight: 500, padding: '0 4px' }}>
          Variant Alerts <Tag style={{ marginLeft: 6, borderRadius: 10, fontSize: 11, border: 'none', backgroundColor: '#e4e5e7' }}>{customVariants.length}</Tag>
        </span>
      ),
      children: <VariantOverridesTable />,
    },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#202223', fontSize: 20 }}>
          Alert Settings
        </Title>
        <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
          Configure threshold rules that trigger inventory warnings.
        </Text>
      </div>

      <Tabs defaultActiveKey="store-wide" items={items} />
    </div>
  )
}

import React from 'react'
import { Card, Select, InputNumber, Button, Space, Typography } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { LocationItem } from '../types/inventory'

const { Text } = Typography

interface FilterHeaderProps {
  locations: LocationItem[]
  selectedLocation: string
  onLocationChange: (value: string) => void
  threshold: number
  onThresholdChange: (value: number) => void
  onSync: () => void
  isSyncing: boolean
}

export const FilterHeader: React.FC<FilterHeaderProps> = ({
  locations,
  selectedLocation,
  onLocationChange,
  threshold,
  onThresholdChange,
  onSync,
  isSyncing,
}) => {
  const locationOptions = [
    { value: 'ALL', label: 'All Locations' },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ]

  return (
    <Card style={{ marginBottom: 16, borderColor: '#e1e3e5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Space size="large">
          <Space orientation="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>Filter by Location</Text>
            <Select
              style={{ width: 280 }}
              value={selectedLocation}
              onChange={onLocationChange}
              options={locationOptions}
            />
          </Space>

          <Space orientation="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>Low Stock Threshold Limit</Text>
            <InputNumber
              min={1}
              max={1000}
              value={threshold}
              onChange={(val) => onThresholdChange(val || 10)}
            />
          </Space>
        </Space>

        <Button
          type="primary"
          icon={<SyncOutlined spin={isSyncing} />}
          onClick={onSync}
          loading={isSyncing}
          style={{ backgroundColor: '#008060' }}
        >
          Sync Inventory
        </Button>
      </div>
    </Card>
  )
}

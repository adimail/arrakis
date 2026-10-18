import React, { useEffect, useState } from 'react'
import { Button, InputNumber, Typography, message, Spin } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Title, Text } = Typography

export const ThresholdSettings: React.FC = () => {
  const queryClient = useQueryClient()
  const setStoreThreshold = useInventoryStore((state) => state.setThreshold)
  const setActiveTab = useInventoryStore((state) => state.setActiveTab)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const [val, setVal] = useState<number>(10)

  useEffect(() => {
    if (data?.threshold !== undefined) {
      setVal(data.threshold)
      setStoreThreshold(data.threshold)
    }
  }, [data, setStoreThreshold])

  const mutation = useMutation({
    mutationFn: (newThreshold: number) => updateSettings(newThreshold),
    onSuccess: (updated) => {
      setStoreThreshold(updated.threshold)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      message.success('Threshold setting saved successfully')
      setActiveTab('home')
    },
    onError: () => {
      message.error('Failed to save settings')
    },
  })

  const handleSave = () => {
    mutation.mutate(val)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#202223' }}>
          Low Inventory Threshold Configuration
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Set the inventory quantity limit below which items display as low stock alerts.
        </Text>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <Text style={{ fontWeight: 500, fontSize: 13, color: '#202223' }}>Quantity</Text>
        <InputNumber
          min={1}
          max={10000}
          value={val}
          onChange={(v) => setVal(v || 1)}
          style={{ width: '100%' }}
        />
      </div>

      <Button
        type="primary"
        loading={mutation.isPending}
        onClick={handleSave}
        style={{
          backgroundColor: '#008060',
          borderColor: '#008060',
          fontWeight: 600,
          minWidth: 120,
        }}
      >
        Save
      </Button>
    </div>
  )
}

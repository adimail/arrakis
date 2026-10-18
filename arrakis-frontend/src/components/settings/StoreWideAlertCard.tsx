import React, { useState } from 'react'
import { Button, InputNumber, Typography, message } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'
import { DEFAULT_THRESHOLD, MAX_THRESHOLD } from '../../lib/constants'

const { Text, Paragraph } = Typography

export const StoreWideAlertCard: React.FC = () => {
  const queryClient = useQueryClient()
  const setActiveTab = useInventoryStore((state) => state.setActiveTab)

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const savedThreshold = settingsData?.threshold ?? DEFAULT_THRESHOLD
  const [draftValue, setDraftValue] = useState<number | null>(null)
  const displayValue = draftValue !== null ? draftValue : savedThreshold

  const globalMutation = useMutation({
    mutationFn: (newThreshold: number) => updateSettings(newThreshold),
    onSuccess: () => {
      setDraftValue(null)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      message.success('Global threshold setting saved')
      setActiveTab('home')
    },
    onError: () => {
      message.error('Failed to save global threshold')
    },
  })

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="card-container" style={{ padding: 20, maxWidth: 640 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 14, color: '#202223' }}>
            Store-wide fallback threshold
          </Text>
          <Paragraph style={{ color: '#6d7175', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            Products and variants with inventory below this number trigger a low stock alert, unless an individual override is set.
          </Paragraph>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <InputNumber
            min={1}
            max={MAX_THRESHOLD}
            value={displayValue}
            onChange={(v) => setDraftValue(v || 1)}
            style={{ width: 140 }}
            size="middle"
          />
          <Text style={{ fontSize: 13, color: '#6d7175' }}>units available</Text>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#f6f6f7',
            border: '1px solid #e1e3e5',
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <InfoCircleOutlined style={{ color: '#6d7175', fontSize: 14 }} />
          <Text style={{ fontSize: 12, color: '#6d7175' }}>
            Changes will update calculations across all products and location scopes.
          </Text>
        </div>

        <Button
          type="primary"
          loading={globalMutation.isPending}
          onClick={() => globalMutation.mutate(displayValue)}
          style={{
            backgroundColor: '#008060',
            borderColor: '#008060',
            fontWeight: 600,
            borderRadius: 6,
            height: 36,
            padding: '0 20px',
          }}
        >
          Save Setting
        </Button>
      </div>
    </div>
  )
}

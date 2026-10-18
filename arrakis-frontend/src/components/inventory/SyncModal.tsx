import React from 'react'
import { Modal, Button, Typography, Tag, message } from 'antd'
import { SyncOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncInventory } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Text, Paragraph } = Typography

export const SyncModal: React.FC = () => {
  const queryClient = useQueryClient()

  const open = useInventoryStore((state) => state.isSyncModalOpen)
  const setIsSyncModalOpen = useInventoryStore((state) => state.setIsSyncModalOpen)
  const lastSynced = useInventoryStore((state) => state.lastSynced)
  const setLastSynced = useInventoryStore((state) => state.setLastSynced)

  const syncMutation = useMutation({
    mutationKey: ['syncInventory'],
    mutationFn: syncInventory,
    onSuccess: (data) => {
      const now = data.syncedAt || new Date().toISOString()
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

  const formatLastSynced = (isoString: string | null) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'Never'
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const getTimeAgo = (isoString: string | null) => {
    if (!isoString) return null
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return null

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

    if (diffSeconds < 10) return 'Just now'
    if (diffSeconds < 60) return `${diffSeconds}s ago`

    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`

    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 30) return `${diffDays}d ago`

    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `${diffMonths}mo ago`

    const diffYears = Math.floor(diffDays / 365)
    return `${diffYears}y ago`
  }

  const timeAgo = getTimeAgo(lastSynced)

  return (
    <Modal
      title="Sync Inventory"
      open={open}
      onCancel={() => setIsSyncModalOpen(false)}
      width={480}
      footer={[
        <Button key="cancel" onClick={() => setIsSyncModalOpen(false)} disabled={syncMutation.isPending}>
          Cancel
        </Button>,
        <Button
          key="sync"
          type="primary"
          icon={<SyncOutlined spin={syncMutation.isPending} />}
          loading={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
          style={{
            backgroundColor: '#008060',
            borderColor: '#008060',
            fontWeight: 600,
          }}
        >
          Sync now
        </Button>,
      ]}
    >
      <div style={{ padding: '8px 0 16px 0' }}>
        <Paragraph style={{ color: '#6d7175', fontSize: 13, marginBottom: 20 }}>
          Sync inventory levels and locations directly from your Shopify store to update your local catalog.
        </Paragraph>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: '#f6f6f7',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #e1e3e5',
          }}
        >
          <ClockCircleOutlined style={{ color: '#5c5f62', fontSize: 18 }} />
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Last Synced
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text strong style={{ fontSize: 14, color: '#202223' }}>
                {formatLastSynced(lastSynced)}
              </Text>
              {timeAgo && (
                <Tag
                  style={{
                    backgroundColor: '#e4e5e7',
                    color: '#202223',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    margin: 0,
                    padding: '0 8px',
                  }}
                >
                  {timeAgo}
                </Tag>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

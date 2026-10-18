import React from 'react'
import { Modal, Button, Typography } from 'antd'
import { SyncOutlined, ClockCircleOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

interface SyncModalProps {
  open: boolean
  onClose: () => void
  onSync: () => void
  isSyncing: boolean
  lastSynced: string | null
}

export const SyncModal: React.FC<SyncModalProps> = ({
  open,
  onClose,
  onSync,
  isSyncing,
  lastSynced,
}) => {
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

  return (
    <Modal
      title="Sync Inventory"
      open={open}
      onCancel={onClose}
      width={480}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isSyncing}>
          Cancel
        </Button>,
        <Button
          key="sync"
          type="primary"
          icon={<SyncOutlined spin={isSyncing} />}
          loading={isSyncing}
          onClick={onSync}
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
            <Text strong style={{ fontSize: 14, color: '#202223' }}>
              {formatLastSynced(lastSynced)}
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  )
}

import React from 'react'
import { Button } from 'antd'
import { SyncOutlined } from '@ant-design/icons'

interface InventoryToolbarProps {
  onSync: () => void
  isSyncing: boolean
}

export const InventoryToolbar: React.FC<InventoryToolbarProps> = ({
  onSync,
  isSyncing,
}) => {
  return (
    <div
      className="inventory-toolbar"
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <Button
        type="primary"
        icon={<SyncOutlined spin={isSyncing} />}
        onClick={onSync}
        loading={isSyncing}
        style={{
          backgroundColor: '#008060',
          borderColor: '#008060',
          fontWeight: 600,
        }}
      >
        Sync inventory
      </Button>
    </div>
  )
}

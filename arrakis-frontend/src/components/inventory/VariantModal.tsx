import React from 'react'
import { Modal, Table, Button, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useInventoryStore } from '../../store/useInventoryStore'
import { VariantResponse } from '../../types/inventory'

const { Text } = Typography

export const VariantModal: React.FC = () => {
  const product = useInventoryStore((state) => state.selectedProduct)
  const visible = useInventoryStore((state) => state.isVariantModalOpen)
  const setIsVariantModalOpen = useInventoryStore((state) => state.setIsVariantModalOpen)
  const threshold = useInventoryStore((state) => state.threshold)

  const handleClose = () => {
    setIsVariantModalOpen(false)
  }

  const columns: ColumnsType<VariantResponse> = [
    {
      title: 'Product',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Text style={{ fontWeight: 500, fontSize: 13, color: '#202223' }}>
          {title}
        </Text>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => (
        <Text style={{ color: '#6d7175', fontSize: 13 }}>{sku || '-'}</Text>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => (
        <Text style={{ fontSize: 13 }}>₹{price || '0.00'}</Text>
      ),
    },
    {
      title: 'Inventory',
      dataIndex: 'inventoryQuantity',
      key: 'inventoryQuantity',
      render: (qty: number) => {
        const isLow = qty < threshold
        return (
          <span
            style={{
              color: isLow ? '#d72c0d' : '#202223',
              fontWeight: isLow ? 600 : 400,
              fontSize: 13,
            }}
          >
            {qty} in stock
          </span>
        )
      },
    },
  ]

  return (
    <Modal
      title="Variants"
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button
          key="close"
          type="primary"
          onClick={handleClose}
          style={{
            backgroundColor: '#008060',
            borderColor: '#008060',
            fontWeight: 600,
          }}
        >
          Close
        </Button>,
      ]}
      width={700}
    >
      <div style={{ padding: '8px 0 16px 0' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {product?.title}
        </Text>
      </div>
      <Table<VariantResponse>
        rowKey="id"
        columns={columns}
        dataSource={product?.variants || []}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Modal>
  )
}

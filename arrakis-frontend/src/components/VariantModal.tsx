import React from 'react'
import { Modal, Table, Typography } from 'antd'
import { ProductResponse, VariantResponse } from '../types/inventory'

const { Text } = Typography

interface VariantModalProps {
  product: ProductResponse | null
  visible: boolean
  onClose: () => void
  threshold: number
}

export const VariantModal: React.FC<VariantModalProps> = ({
  product,
  visible,
  onClose,
  threshold,
}) => {
  const columns = [
    {
      title: 'Variant Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => <Text type="secondary">{sku || 'N/A'}</Text>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: string) => `₹${price || '0.00'}`,
    },
    {
      title: 'Available Inventory',
      dataIndex: 'inventoryQuantity',
      key: 'inventoryQuantity',
      render: (qty: number) => {
        const isLow = qty < threshold
        return (
          <Text style={{ color: isLow ? '#d72c0d' : '#202223', fontWeight: isLow ? 600 : 400 }}>
            {qty} in stock
          </Text>
        )
      },
    },
  ]

  return (
    <Modal
      title={product?.title || 'Product Variants'}
      open={visible}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Table<VariantResponse>
        rowKey="id"
        columns={columns}
        dataSource={product?.variants || []}
        pagination={false}
        size="small"
        style={{ marginTop: 16 }}
      />
    </Modal>
  )
}

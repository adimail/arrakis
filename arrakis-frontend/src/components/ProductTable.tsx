import React from 'react'
import { Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ProductResponse } from '../types/inventory'

const { Text } = Typography

interface ProductTableProps {
  products: ProductResponse[]
  loading: boolean
  total: number
  currentPage: number
  onPageChange: (page: number) => void
  onRowClick: (product: ProductResponse) => void
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  loading,
  total,
  currentPage,
  onPageChange,
  onRowClick,
}) => {
  const columns: ColumnsType<ProductResponse> = [
    {
      title: 'Product',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Text style={{ fontWeight: 600, color: '#2c6ecb', cursor: 'pointer' }}>
          {title}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const active = status?.toUpperCase() === 'ACTIVE'
        return <Tag color={active ? 'success' : 'default'}>{status || 'ACTIVE'}</Tag>
      },
    },
    {
      title: 'Inventory',
      key: 'inventory',
      render: (_, record) => {
        const count = record.totalInventory
        const isLow = record.isLowInventory
        const variantCount = record.variants.length
        return (
          <Text style={{ color: isLow ? '#d72c0d' : '#202223', fontWeight: isLow ? 600 : 400 }}>
            {count} in stock{variantCount > 1 ? ` for ${variantCount} variants` : ''}
          </Text>
        )
      },
    },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      render: (type: string) => type || 'Standard',
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      render: (vendor: string) => <Text type="secondary">{vendor || 'N/A'}</Text>,
    },
  ]

  return (
    <Table<ProductResponse>
      rowKey="id"
      columns={columns}
      dataSource={products}
      loading={loading}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        current: currentPage + 1,
        pageSize: 10,
        total,
        onChange: (page) => onPageChange(page - 1),
        showSizeChanger: false,
      }}
      bordered={false}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e1e3e5',
      }}
    />
  )
}

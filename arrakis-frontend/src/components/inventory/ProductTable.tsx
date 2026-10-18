import React from 'react'
import { Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PictureOutlined } from '@ant-design/icons'
import { ProductResponse } from '../../types/inventory'

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
  const getStatusTag = (status?: string) => {
    const s = (status || 'ACTIVE').toUpperCase()
    if (s === 'ACTIVE') {
      return (
        <Tag
          style={{
            backgroundColor: '#cbf4c9',
            color: '#0e6245',
            border: 'none',
            borderRadius: 12,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Active
        </Tag>
      )
    }
    if (s === 'DRAFT') {
      return (
        <Tag
          style={{
            backgroundColor: '#e4e5e7',
            color: '#4a4a4a',
            border: 'none',
            borderRadius: 12,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Draft
        </Tag>
      )
    }
    return (
      <Tag
        style={{
          backgroundColor: '#e4e5e7',
          color: '#6d7175',
          border: 'none',
          borderRadius: 12,
          padding: '1px 8px',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Archived
      </Tag>
    )
  }

  const columns: ColumnsType<ProductResponse> = [
    {
      title: 'Product',
      key: 'product',
      minWidth: 160,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: '#f1f2f3',
              border: '1px solid #e1e3e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {record.imageUrl ? (
              <img
                src={record.imageUrl}
                alt={record.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PictureOutlined style={{ color: '#8c9196', fontSize: 16 }} />
            )}
          </div>
          <Text style={{ fontWeight: 500, color: '#202223', fontSize: 13, lineHeight: 1.3 }}>
            {record.title}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Inventory',
      key: 'inventory',
      minWidth: 120,
      render: (_, record) => {
        const count = record.totalInventory ?? 0
        const isLow = record.isLowInventory ?? false
        const variantCount = record.variants?.length ?? 0

        let text = `${count} in stock`
        if (variantCount > 1) {
          text = `${count} in stock (${variantCount} variants)`
        }

        return (
          <span
            style={{
              color: isLow ? '#d72c0d' : '#202223',
              fontWeight: isLow ? 600 : 400,
              fontSize: 13,
            }}
          >
            {text}
          </span>
        )
      },
    },
    {
      title: 'Type',
      dataIndex: 'productType',
      key: 'productType',
      minWidth: 120,
      responsive: ['md'],
      render: (type: string) => (
        <Text style={{ color: '#202223', fontSize: 13 }}>{type || '-'}</Text>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      minWidth: 130,
      responsive: ['md'],
      render: (vendor: string) => (
        <Text style={{ color: '#202223', fontSize: 13 }}>{vendor || '-'}</Text>
      ),
    },
  ]

  return (
    <Table<ProductResponse>
      rowKey="id"
      columns={columns}
      dataSource={products}
      loading={loading}
      scroll={{ x: 'max-content' }}
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

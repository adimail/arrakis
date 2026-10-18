import React from 'react'
import { Table, Tag, Typography, Switch, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PictureOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts, fetchMetrics, fetchLocations, type ProductResponse } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Text } = Typography

export const ProductTable: React.FC = () => {
  const page = useInventoryStore((state) => state.page)
  const setPage = useInventoryStore((state) => state.setPage)
  const locationId = useInventoryStore((state) => state.locationId)
  const threshold = useInventoryStore((state) => state.threshold)
  const lowStockOnly = useInventoryStore((state) => state.lowStockOnly)
  const setLowStockOnly = useInventoryStore((state) => state.setLowStockOnly)
  const setSelectedProduct = useInventoryStore((state) => state.setSelectedProduct)
  const setIsVariantModalOpen = useInventoryStore((state) => state.setIsVariantModalOpen)

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  })

  const { data: metrics } = useQuery({
    queryKey: ['metrics', locationId, threshold],
    queryFn: () => fetchMetrics(locationId, threshold),
  })

  const { data: productPage, isLoading } = useQuery({
    queryKey: ['products', page, locationId, threshold, lowStockOnly],
    queryFn: () => fetchProducts(page, locationId, threshold, lowStockOnly),
  })

  const selectedLocationName =
    locationId === 'ALL'
      ? 'All Locations (Pooled)'
      : locations.find((l) => l.id === locationId)?.name || 'Specific Location'

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
            whiteSpace: 'nowrap',
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
            whiteSpace: 'nowrap',
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
          whiteSpace: 'nowrap',
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
      width: 280,
      render: (_, record) => {
        const customVariants = record.variants?.filter(
          (v) => v.alertThreshold !== null && v.alertThreshold !== undefined
        ) || []
        const hasCustom = customVariants.length > 0

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
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
                <PictureOutlined style={{ color: '#8c9196', fontSize: 18 }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Text
                style={{
                  fontWeight: 600,
                  color: '#202223',
                  fontSize: 13,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 200,
                }}
              >
                {record.title}
              </Text>
              {hasCustom && (
                <Tooltip
                  title={`Custom threshold set on ${customVariants.length} variant${
                    customVariants.length > 1 ? 's' : ''
                  }`}
                >
                  <Tag
                    icon={<SlidersOutlined />}
                    style={{
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      border: 'none',
                      borderRadius: 10,
                      padding: '0 6px',
                      fontSize: 11,
                      margin: 0,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Custom
                  </Tag>
                </Tooltip>
              )}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status?: string) => getStatusTag(status),
    },
    {
      title: 'Inventory',
      key: 'inventory',
      width: 220,
      render: (_, record) => {
        const count = record.totalInventory ?? 0
        const isLow = record.isLowInventory ?? false
        const variantCount = record.variants?.length ?? 0

        let text = `${count} in stock`
        if (variantCount > 1) {
          text = `${count} in stock for ${variantCount} variants`
        }

        return (
          <span
            style={{
              color: isLow ? '#d72c0d' : '#202223',
              fontWeight: isLow ? 600 : 400,
              fontSize: 13,
              whiteSpace: 'nowrap',
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
      width: 160,
      render: (type?: string) => (
        <Text style={{ color: '#202223', fontSize: 13, whiteSpace: 'nowrap' }}>
          {type || '—'}
        </Text>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      width: 180,
      render: (vendor?: string) => (
        <Text style={{ color: '#202223', fontSize: 13, whiteSpace: 'nowrap' }}>
          {vendor || '—'}
        </Text>
      ),
    },
  ]

  const lowCount = metrics?.lowStockCount ?? 0

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #e1e3e5',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Tag
            icon={<AlertOutlined />}
            style={{
              backgroundColor: lowCount > 0 ? '#fed3d1' : '#e4e5e7',
              color: lowCount > 0 ? '#d72c0d' : '#4a4a4a',
              border: 'none',
              borderRadius: 14,
              padding: '3px 12px',
              fontWeight: 600,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {lowCount} Low Stock {lowCount === 1 ? 'Alert' : 'Alerts'}
          </Tag>

          <Tag
            icon={<EnvironmentOutlined />}
            style={{
              backgroundColor: '#f1f2f4',
              color: '#202223',
              border: '1px solid #d2d5d8',
              borderRadius: 14,
              padding: '3px 12px',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              maxWidth: 320,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Scope: {selectedLocationName}
          </Tag>

          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            Threshold: &lt; {threshold}
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <Text style={{ fontSize: 13, fontWeight: 500, color: '#202223' }}>
            Show Low Stock Only
          </Text>
          <Switch
            checked={lowStockOnly}
            onChange={(checked) => setLowStockOnly(checked)}
            style={{
              backgroundColor: lowStockOnly ? '#008060' : undefined,
            }}
          />
        </div>
      </div>

      <Table<ProductResponse>
        rowKey="id"
        columns={columns}
        dataSource={productPage?.content || []}
        loading={isLoading}
        scroll={{ x: 940 }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedProduct(record)
            setIsVariantModalOpen(true)
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: page + 1,
          pageSize: 10,
          total: productPage?.totalElements || 0,
          onChange: (p) => setPage(p - 1),
          showSizeChanger: false,
        }}
        bordered={false}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e1e3e5',
        }}
      />
    </div>
  )
}

import React, { useEffect } from 'react'
import { Table, Tag, Typography, Switch, Tooltip, Image } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PictureOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts, fetchMetrics, fetchLocations, fetchSettings, type ProductResponse } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'
import { DEFAULT_THRESHOLD, PAGE_SIZE, ALL_LOCATIONS_KEY } from '../../lib/constants'

const { Text } = Typography

export const ProductTable: React.FC = () => {
  const page = useInventoryStore((state) => state.page)
  const setPage = useInventoryStore((state) => state.setPage)
  const locationId = useInventoryStore((state) => state.locationId)
  const lowStockOnly = useInventoryStore((state) => state.lowStockOnly)
  const setLowStockOnly = useInventoryStore((state) => state.setLowStockOnly)
  const setSelectedProduct = useInventoryStore((state) => state.setSelectedProduct)
  const setIsVariantModalOpen = useInventoryStore((state) => state.setIsVariantModalOpen)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const threshold = settings?.threshold ?? DEFAULT_THRESHOLD

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
    queryFn: () => fetchProducts(page - 1, locationId, threshold, lowStockOnly),
  })

  useEffect(() => {
    if (productPage) {
      const totalPages = productPage.totalPages ?? 0
      if (totalPages > 0 && page > totalPages) {
        setPage(1)
      } else if (totalPages === 0 && page > 1) {
        setPage(1)
      }
    }
  }, [productPage, page, setPage])

  const selectedLocationName =
    locationId === ALL_LOCATIONS_KEY
      ? 'All Locations (Pooled)'
      : locations.find((l) => l.id === locationId)?.name || 'Specific Location'

  const getStatusTag = (status?: string) => {
    const s = (status || 'ACTIVE').toUpperCase()
    if (s === 'ACTIVE') {
      return (
        <Tag
          className="stock-tag-success"
          style={{
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
          className="stock-tag-neutral"
          style={{
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
        className="stock-tag-neutral"
        style={{
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
              onClick={(e) => e.stopPropagation()}
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
                <Image
                  src={record.imageUrl}
                  alt={record.title}
                  width={38}
                  height={38}
                  style={{ objectFit: 'cover' }}
                  preview={{
                    mask: null,
                  }}
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
        className="card-container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Tag
            icon={<AlertOutlined />}
            className={lowCount > 0 ? 'stock-tag-danger' : 'stock-tag-neutral'}
            style={{
              borderRadius: 14,
              padding: '3px 12px',
              fontWeight: 600,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {lowCount} Low Stock {lowCount === 1 ? 'Alert' : 'Alerts'}
          </Tag>

          <Tag icon={<EnvironmentOutlined />} className="scope-badge">
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
          current: page,
          pageSize: PAGE_SIZE,
          total: productPage?.totalElements || 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
        }}
        bordered={false}
        className="card-container"
      />
    </div>
  )
}

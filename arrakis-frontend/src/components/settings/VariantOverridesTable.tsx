import React, { useState } from 'react'
import {
  Button,
  InputNumber,
  Typography,
  message,
  Table,
  Popconfirm,
  Empty,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCustomThresholdVariants,
  updateVariantThreshold,
  type CustomThresholdVariant,
} from '../../api/inventory'
import { MIN_THRESHOLD, MAX_THRESHOLD } from '../../lib/constants'
import { formatCurrency } from '../../lib/utils'

const { Text, Paragraph } = Typography

export const VariantOverridesTable: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: customVariants = [], isLoading: isVariantsLoading } = useQuery({
    queryKey: ['customVariants'],
    queryFn: fetchCustomThresholdVariants,
  })

  const [dirtyDrafts, setDirtyDrafts] = useState<Record<string, number>>({})

  const variantMutation = useMutation({
    mutationFn: ({ variantId, threshold }: { variantId: string; threshold: number | null }) =>
      updateVariantThreshold(variantId, threshold),
    onSuccess: (_, variables) => {
      message.success('Variant threshold updated')
      setDirtyDrafts((prev) => {
        const next = { ...prev }
        delete next[variables.variantId]
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['customVariants'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: () => {
      message.error('Failed to update variant threshold')
    },
  })

  const columns: ColumnsType<CustomThresholdVariant> = [
    {
      title: 'Product',
      dataIndex: 'productTitle',
      key: 'productTitle',
      width: 280,
      render: (pTitle?: string) => (
        <Text strong style={{ fontSize: 13, color: '#202223', whiteSpace: 'nowrap' }}>
          {pTitle || '—'}
        </Text>
      ),
    },
    {
      title: 'Variant',
      dataIndex: 'variantTitle',
      key: 'variantTitle',
      width: 180,
      render: (vTitle?: string) => (
        <Text style={{ fontSize: 13, color: '#202223', whiteSpace: 'nowrap' }}>
          {vTitle || 'Default Title'}
        </Text>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 130,
      render: (sku?: string) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#6d7175', whiteSpace: 'nowrap' }}>
          {sku || '—'}
        </Text>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      align: 'right',
      render: (price?: string) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#202223', whiteSpace: 'nowrap' }}>
          {formatCurrency(price)}
        </span>
      ),
    },
    {
      title: 'Custom Alert Threshold',
      key: 'alertThreshold',
      width: 190,
      render: (_, record) => {
        const id = record.variantId || ''
        const currentValue = id in dirtyDrafts ? dirtyDrafts[id] : (record.alertThreshold ?? 0)
        const isDirty = id in dirtyDrafts && dirtyDrafts[id] !== record.alertThreshold
        const isPending = variantMutation.isPending && variantMutation.variables?.variantId === id

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <InputNumber
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              value={currentValue}
              onChange={(nextVal) =>
                setDirtyDrafts((prev) => ({
                  ...prev,
                  [id]: nextVal || 0,
                }))
              }
              style={{
                width: 100,
                borderColor: isDirty ? '#008060' : '#7dd3fc',
                backgroundColor: isDirty ? '#f6fdf9' : '#f0f9ff',
              }}
            />

            {isDirty && (
              <Tooltip title="Save changes">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={isPending}
                  onClick={() =>
                    variantMutation.mutate({
                      variantId: id,
                      threshold: currentValue,
                    })
                  }
                  style={{
                    backgroundColor: '#008060',
                    borderColor: '#008060',
                    borderRadius: 6,
                  }}
                />
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => {
        const id = record.variantId || ''
        const isPending = variantMutation.isPending && variantMutation.variables?.variantId === id

        return (
          <Popconfirm
            title="Reset to Global"
            description="Remove custom threshold and use store global threshold?"
            onConfirm={() => {
              setDirtyDrafts((prev) => {
                const next = { ...prev }
                delete next[id]
                return next
              })
              variantMutation.mutate({
                variantId: id,
                threshold: null,
              })
            }}
            okText="Reset"
            cancelText="Cancel"
          >
            <Button
              size="small"
              danger
              type="text"
              icon={<DeleteOutlined />}
              loading={isPending}
              style={{ borderRadius: 6, whiteSpace: 'nowrap' }}
            >
              Reset
            </Button>
          </Popconfirm>
        )
      },
    },
  ]

  if (customVariants.length === 0) {
    return (
      <div style={{ paddingTop: 16 }}>
        <div className="card-container" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text strong style={{ fontSize: 14, color: '#202223', display: 'block' }}>
                  No variant overrides configured
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  To set a custom threshold for a specific variant, click on any product from the Home table.
                </Text>
              </div>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div className="card-container" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e1e3e5' }}>
          <Text strong style={{ fontSize: 14, color: '#202223' }}>
            Custom Variant Overrides
          </Text>
          <Paragraph style={{ color: '#6d7175', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
            These variants override the global threshold. Resetting a variant restores store-wide behavior.
          </Paragraph>
        </div>

        <Table<CustomThresholdVariant>
          rowKey="variantId"
          columns={columns}
          dataSource={customVariants as CustomThresholdVariant[]}
          loading={isVariantsLoading}
          pagination={false}
          size="middle"
          bordered={false}
          scroll={{ x: 990 }}
        />
      </div>
    </div>
  )
}

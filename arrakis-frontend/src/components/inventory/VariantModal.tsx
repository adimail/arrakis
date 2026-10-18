import React, { useState } from 'react'
import { Modal, Table, Button, Typography, InputNumber, Tag, Tooltip, Image, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckOutlined,
  ReloadOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  SlidersOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { updateVariantThreshold, fetchSettings, type VariantResponse } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'
import { DEFAULT_THRESHOLD, MIN_THRESHOLD, MAX_THRESHOLD } from '../../lib/constants'
import { formatCurrency } from '../../lib/utils'

const { Text, Title } = Typography

export const VariantModal: React.FC = () => {
  const queryClient = useQueryClient()
  const product = useInventoryStore((state) => state.selectedProduct)
  const setSelectedProduct = useInventoryStore((state) => state.setSelectedProduct)
  const visible = useInventoryStore((state) => state.isVariantModalOpen)
  const setIsVariantModalOpen = useInventoryStore((state) => state.setIsVariantModalOpen)
  const locationId = useInventoryStore((state) => state.locationId)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const globalThreshold = settings?.threshold ?? DEFAULT_THRESHOLD

  const [dirtyDrafts, setDirtyDrafts] = useState<Record<string, number | null>>({})

  const variantMutation = useMutation({
    mutationFn: ({ variantId, threshold }: { variantId: string; threshold: number | null }) =>
      updateVariantThreshold(variantId, threshold, locationId),
    onSuccess: (updatedVariant, variables) => {
      message.success('Threshold updated')
      setDirtyDrafts((prev) => {
        const next = { ...prev }
        delete next[variables.variantId]
        return next
      })

      if (product && product.variants) {
        const nextVariants = product.variants.map((v) =>
          v.id === updatedVariant.id ? { ...v, ...updatedVariant } : v
        )
        const hasLow = nextVariants.some((v) => v.isLowInventory)
        const total = product.totalInventory ?? 0
        setSelectedProduct({
          ...product,
          isLowInventory: hasLow || total < globalThreshold,
          variants: nextVariants,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      queryClient.invalidateQueries({ queryKey: ['customVariants'] })
    },
    onError: () => {
      message.error('Failed to update threshold')
    },
  })

  const handleClose = () => {
    setIsVariantModalOpen(false)
  }

  const columns: ColumnsType<VariantResponse> = [
    {
      title: 'Variant',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title?: string) => (
        <Text strong style={{ fontSize: 13, color: '#202223' }}>
          {title || 'Default Title'}
        </Text>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
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
      title: 'Available Stock',
      dataIndex: 'inventoryQuantity',
      key: 'inventoryQuantity',
      width: 150,
      align: 'center',
      render: (qty: number, record: VariantResponse) => {
        const isLow = record.isLowInventory
        return (
          <Tag
            icon={isLow ? <AlertOutlined /> : <CheckCircleOutlined />}
            className={isLow ? 'stock-tag-danger' : 'stock-tag-success'}
            style={{
              margin: 0,
              padding: '2px 10px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 12,
              whiteSpace: 'nowrap',
            }}
          >
            {qty} in stock
          </Tag>
        )
      },
    },
    {
      title: 'Alert Rule',
      key: 'alertThreshold',
      width: 180,
      render: (_, record: VariantResponse) => {
        const id = record.id || ''
        const currentValue = id in dirtyDrafts ? dirtyDrafts[id] : (record.alertThreshold ?? null)
        const hasSavedCustom = record.alertThreshold !== null && record.alertThreshold !== undefined
        const isDirty = id in dirtyDrafts && dirtyDrafts[id] !== (record.alertThreshold ?? null)
        const isPending = variantMutation.isPending && variantMutation.variables?.variantId === id

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <InputNumber
              placeholder={`Global (${globalThreshold})`}
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              value={currentValue}
              onChange={(val) =>
                setDirtyDrafts((prev) => ({
                  ...prev,
                  [id]: val === undefined ? null : val,
                }))
              }
              style={{
                width: 110,
                borderColor: hasSavedCustom ? '#7dd3fc' : undefined,
                backgroundColor: hasSavedCustom ? '#f0f9ff' : undefined,
              }}
            />

            {isDirty && (
              <Tooltip title="Save threshold">
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

            {hasSavedCustom && (
              <Tooltip title="Reset to global store threshold">
                <Button
                  size="small"
                  type="text"
                  icon={<ReloadOutlined style={{ color: '#8c9196', fontSize: 12 }} />}
                  loading={isPending}
                  onClick={() => {
                    setDirtyDrafts((prev) => {
                      const next = { ...prev }
                      delete next[id]
                      return next
                    })
                    variantMutation.mutate({ variantId: id, threshold: null })
                  }}
                  style={{ borderRadius: 6 }}
                />
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]

  const totalQty = product?.totalInventory ?? 0
  const isOverallLow = product?.isLowInventory ?? false
  const variantsList = (product?.variants || []) as VariantResponse[]

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button
          key="close"
          onClick={handleClose}
          style={{
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          Done
        </Button>,
      ]}
      width={840}
      styles={{
        header: {
          paddingBottom: 16,
          borderBottom: '1px solid #f1f2f3',
        },
        body: {
          paddingTop: 16,
          paddingBottom: 8,
        },
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {product?.imageUrl ? (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                border: '1px solid #e1e3e5',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Image
                src={product.imageUrl}
                alt={product.title}
                width={40}
                height={40}
                style={{ objectFit: 'cover' }}
                preview={{
                  mask: null,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                border: '1px solid #e1e3e5',
                backgroundColor: '#f6f6f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8c9196',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {product?.title?.charAt(0) || 'P'}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title
              level={5}
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: '#202223',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {product?.title}
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {product?.vendor || 'No Vendor'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>•</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {variantsList.length} {variantsList.length === 1 ? 'variant' : 'variants'}
              </Text>
            </div>
          </div>
        </div>
      }
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f6f6f7',
          padding: '10px 14px',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 13, color: '#6d7175' }}>Total Inventory:</Text>
          <Text strong style={{ fontSize: 13, color: isOverallLow ? '#d72c0d' : '#202223' }}>
            {totalQty} units
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SlidersOutlined style={{ color: '#8c9196', fontSize: 12 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Global fallback: &lt; {globalThreshold}
          </Text>
        </div>
      </div>

      <Table<VariantResponse>
        rowKey="id"
        columns={columns}
        dataSource={variantsList}
        pagination={false}
        size="middle"
        bordered={false}
        scroll={{ x: 740 }}
        className="card-container"
        style={{ overflow: 'hidden' }}
      />
    </Modal>
  )
}

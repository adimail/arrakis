import React, { useState, useEffect } from 'react'
import { Modal, Table, Button, Typography, InputNumber, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateVariantThreshold, type VariantResponse } from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Text } = Typography

export const VariantModal: React.FC = () => {
  const queryClient = useQueryClient()
  const product = useInventoryStore((state) => state.selectedProduct)
  const visible = useInventoryStore((state) => state.isVariantModalOpen)
  const setIsVariantModalOpen = useInventoryStore((state) => state.setIsVariantModalOpen)
  const globalThreshold = useInventoryStore((state) => state.threshold)

  const [thresholdDrafts, setThresholdDrafts] = useState<Record<string, number | null>>({})

  useEffect(() => {
    if (product?.variants) {
      const drafts: Record<string, number | null> = {}
      for (const v of product.variants) {
        if (v.id) {
          drafts[v.id] = v.alertThreshold ?? null
        }
      }
      setThresholdDrafts(drafts)
    }
  }, [product])

  const mutation = useMutation({
    mutationFn: ({ variantId, threshold }: { variantId: string; threshold: number | null }) =>
      updateVariantThreshold(variantId, threshold),
    onSuccess: (updatedVariant) => {
      message.success('Variant threshold updated')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      if (product && product.variants) {
        const nextVariants = product.variants.map((v) =>
          v.id === updatedVariant.id ? { ...v, ...updatedVariant } : v
        )
        const hasLow = nextVariants.some((v) => v.isLowInventory)
        const total = product.totalInventory ?? 0
        useInventoryStore.getState().setSelectedProduct({
          ...product,
          isLowInventory: hasLow || total < globalThreshold,
          variants: nextVariants,
        })
      }
    },
    onError: () => {
      message.error('Failed to update variant threshold')
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
      render: (title?: string) => (
        <Text style={{ fontWeight: 500, fontSize: 13, color: '#202223' }}>
          {title || '-'}
        </Text>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku?: string) => (
        <Text style={{ color: '#6d7175', fontSize: 13 }}>{sku || '-'}</Text>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price?: string) => (
        <Text style={{ fontSize: 13 }}>₹{price || '0.00'}</Text>
      ),
    },
    {
      title: 'Inventory',
      dataIndex: 'inventoryQuantity',
      key: 'inventoryQuantity',
      render: (qty: number, record: VariantResponse) => {
        const isLow = record.isLowInventory
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
    {
      title: 'Custom Alert Threshold',
      key: 'alertThreshold',
      render: (_, record: VariantResponse) => {
        const id = record.id || ''
        const draftVal = thresholdDrafts[id]
        const hasChanged = draftVal !== (record.alertThreshold ?? null)

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <InputNumber
              placeholder={`Global (${globalThreshold})`}
              min={0}
              max={10000}
              value={draftVal}
              onChange={(val) =>
                setThresholdDrafts((prev) => ({
                  ...prev,
                  [id]: val === undefined ? null : val,
                }))
              }
              style={{ width: 130 }}
            />
            {hasChanged && (
              <Button
                size="small"
                type="primary"
                loading={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    variantId: id,
                    threshold: draftVal ?? null,
                  })
                }
                style={{
                  backgroundColor: '#008060',
                  borderColor: '#008060',
                  fontWeight: 500,
                }}
              >
                Apply
              </Button>
            )}
          </div>
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
      width={780}
    >
      <div style={{ padding: '8px 0 16px 0' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {product?.title}
        </Text>
      </div>
      <Table<VariantResponse>
        rowKey="id"
        columns={columns}
        dataSource={(product?.variants || []) as VariantResponse[]}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Modal>
  )
}

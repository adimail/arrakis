import React, { useEffect, useState } from 'react'
import {
  Button,
  InputNumber,
  Typography,
  message,
  Spin,
  Tabs,
  Table,
  Card,
  Popconfirm,
  Empty,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSettings,
  updateSettings,
  fetchCustomThresholdVariants,
  updateVariantThreshold,
} from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'
import { CustomThresholdVariant } from '../../types/inventory'

const { Title, Text } = Typography

export const ThresholdSettings: React.FC = () => {
  const queryClient = useQueryClient()
  const setStoreThreshold = useInventoryStore((state) => state.setThreshold)
  const setActiveTab = useInventoryStore((state) => state.setActiveTab)

  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const { data: customVariants = [], isLoading: isVariantsLoading } = useQuery({
    queryKey: ['customVariants'],
    queryFn: fetchCustomThresholdVariants,
  })

  const [val, setVal] = useState<number>(10)
  const [drafts, setDrafts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (settingsData?.threshold !== undefined) {
      setVal(settingsData.threshold)
      setStoreThreshold(settingsData.threshold)
    }
  }, [settingsData, setStoreThreshold])

  useEffect(() => {
    const initialDrafts: Record<string, number> = {}
    for (const item of customVariants) {
      initialDrafts[item.variantId] = item.alertThreshold
    }
    setDrafts(initialDrafts)
  }, [customVariants])

  const globalMutation = useMutation({
    mutationFn: (newThreshold: number) => updateSettings(newThreshold),
    onSuccess: (updated) => {
      setStoreThreshold(updated.threshold)
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      message.success('Global threshold setting saved')
      setActiveTab('home')
    },
    onError: () => {
      message.error('Failed to save global threshold')
    },
  })

  const variantMutation = useMutation({
    mutationFn: ({ variantId, threshold }: { variantId: string; threshold: number | null }) =>
      updateVariantThreshold(variantId, threshold),
    onSuccess: () => {
      message.success('Variant threshold updated')
      queryClient.invalidateQueries({ queryKey: ['customVariants'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: () => {
      message.error('Failed to update variant threshold')
    },
  })

  const handleGlobalSave = () => {
    globalMutation.mutate(val)
  }

  const columns: ColumnsType<CustomThresholdVariant> = [
    {
      title: 'Product',
      dataIndex: 'productTitle',
      key: 'productTitle',
      render: (pTitle: string) => <Text strong style={{ fontSize: 13 }}>{pTitle}</Text>,
    },
    {
      title: 'Variant',
      dataIndex: 'variantTitle',
      key: 'variantTitle',
      render: (vTitle: string) => <Text style={{ fontSize: 13 }}>{vTitle}</Text>,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string) => <Text type="secondary" style={{ fontSize: 13 }}>{sku || '-'}</Text>,
    },
    {
      title: 'Alert Threshold',
      key: 'alertThreshold',
      render: (_, record) => (
        <InputNumber
          min={0}
          max={10000}
          value={drafts[record.variantId] ?? record.alertThreshold}
          onChange={(nextVal) =>
            setDrafts((prev) => ({
              ...prev,
              [record.variantId]: nextVal || 0,
            }))
          }
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const currentDraft = drafts[record.variantId] ?? record.alertThreshold
        const hasChanged = currentDraft !== record.alertThreshold

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasChanged && (
              <Button
                size="small"
                type="primary"
                icon={<SaveOutlined />}
                loading={variantMutation.isPending}
                onClick={() =>
                  variantMutation.mutate({
                    variantId: record.variantId,
                    threshold: currentDraft,
                  })
                }
                style={{ backgroundColor: '#008060', borderColor: '#008060' }}
              >
                Save
              </Button>
            )}

            <Popconfirm
              title="Reset to Global"
              description="Remove custom threshold and inherit global store threshold?"
              onConfirm={() =>
                variantMutation.mutate({
                  variantId: record.variantId,
                  threshold: null,
                })
              }
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Reset
              </Button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  if (isSettingsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  const items = [
    {
      key: 'store-wide',
      label: 'Store-Wide Alert',
      children: (
        <div style={{ maxWidth: 480, padding: '16px 0' }}>
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Set the fallback inventory threshold for all products in your store.
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <Text style={{ fontWeight: 500, fontSize: 13, color: '#202223' }}>Quantity</Text>
            <InputNumber
              min={1}
              max={10000}
              value={val}
              onChange={(v) => setVal(v || 1)}
              style={{ width: '100%' }}
            />
          </div>

          <Button
            type="primary"
            loading={globalMutation.isPending}
            onClick={handleGlobalSave}
            style={{
              backgroundColor: '#008060',
              borderColor: '#008060',
              fontWeight: 600,
              minWidth: 120,
            }}
          >
            Save
          </Button>
        </div>
      ),
    },
    {
      key: 'variant-overrides',
      label: `Variant Alerts (${customVariants.length})`,
      children: (
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Variants listed below override the store-wide alert threshold.
            </Text>
          </div>

          {customVariants.length === 0 ? (
            <Empty
              description="No custom variant thresholds set yet. Set them from the home product table modal."
              style={{ padding: '32px 0' }}
            />
          ) : (
            <Table<CustomThresholdVariant>
              rowKey="variantId"
              columns={columns}
              dataSource={customVariants}
              loading={isVariantsLoading}
              pagination={false}
              size="middle"
              bordered={false}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 8,
                border: '1px solid #e1e3e5',
              }}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <Card
      style={{
        maxWidth: 820,
        margin: '20px auto',
        borderRadius: 8,
        border: '1px solid #e1e3e5',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#202223' }}>
          Alert Settings
        </Title>
      </div>
      <Tabs defaultActiveKey="store-wide" items={items} />
    </Card>
  )
}

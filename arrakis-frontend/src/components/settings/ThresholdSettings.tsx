import React, { useEffect, useState } from 'react'
import {
  Button,
  InputNumber,
  Typography,
  message,
  Spin,
  Tabs,
  Table,
  Popconfirm,
  Empty,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSettings,
  updateSettings,
  fetchCustomThresholdVariants,
  updateVariantThreshold,
  type CustomThresholdVariant,
} from '../../api/inventory'
import { useInventoryStore } from '../../store/useInventoryStore'

const { Title, Text, Paragraph } = Typography

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
      if (item.variantId) {
        initialDrafts[item.variantId] = item.alertThreshold ?? 0
      }
    }
    setDrafts(initialDrafts)
  }, [customVariants])

  const globalMutation = useMutation({
    mutationFn: (newThreshold: number) => updateSettings(newThreshold),
    onSuccess: (updated) => {
      setStoreThreshold(updated.threshold ?? val)
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
          {price ? `₹${price}` : '—'}
        </span>
      ),
    },
    {
      title: 'Custom Alert Threshold',
      key: 'alertThreshold',
      width: 190,
      render: (_, record) => {
        const id = record.variantId || ''
        const currentDraft = drafts[id] ?? record.alertThreshold ?? 0
        const hasChanged = currentDraft !== record.alertThreshold
        const isPending = variantMutation.isPending && variantMutation.variables?.variantId === id

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <InputNumber
              min={0}
              max={10000}
              value={currentDraft}
              onChange={(nextVal) =>
                setDrafts((prev) => ({
                  ...prev,
                  [id]: nextVal || 0,
                }))
              }
              style={{
                width: 100,
                borderColor: hasChanged ? '#008060' : '#7dd3fc',
                backgroundColor: hasChanged ? '#f6fdf9' : '#f0f9ff',
              }}
            />

            {hasChanged && (
              <Tooltip title="Save changes">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={isPending}
                  onClick={() =>
                    variantMutation.mutate({
                      variantId: id,
                      threshold: currentDraft,
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
            onConfirm={() =>
              variantMutation.mutate({
                variantId: id,
                threshold: null,
              })
            }
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
      label: (
        <span style={{ fontSize: 13, fontWeight: 500, padding: '0 4px' }}>
          Store-Wide Alert
        </span>
      ),
      children: (
        <div style={{ paddingTop: 16 }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e3e5',
              borderRadius: 8,
              padding: 20,
              maxWidth: 640,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 14, color: '#202223' }}>
                Store-wide fallback threshold
              </Text>
              <Paragraph style={{ color: '#6d7175', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                Products and variants with inventory below this number trigger a low stock alert, unless an individual override is set.
              </Paragraph>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <InputNumber
                min={1}
                max={10000}
                value={val}
                onChange={(v) => setVal(v || 1)}
                style={{ width: 140 }}
                size="middle"
              />
              <Text style={{ fontSize: 13, color: '#6d7175' }}>units available</Text>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#f6f6f7',
                border: '1px solid #e1e3e5',
                padding: '10px 14px',
                borderRadius: 6,
                marginBottom: 20,
              }}
            >
              <InfoCircleOutlined style={{ color: '#6d7175', fontSize: 14 }} />
              <Text style={{ fontSize: 12, color: '#6d7175' }}>
                Changes will update calculations across all products and location scopes.
              </Text>
            </div>

            <Button
              type="primary"
              loading={globalMutation.isPending}
              onClick={handleGlobalSave}
              style={{
                backgroundColor: '#008060',
                borderColor: '#008060',
                fontWeight: 600,
                borderRadius: 6,
                height: 36,
                padding: '0 20px',
              }}
            >
              Save Setting
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'variant-overrides',
      label: (
        <span style={{ fontSize: 13, fontWeight: 500, padding: '0 4px' }}>
          Variant Alerts <Tag style={{ marginLeft: 6, borderRadius: 10, fontSize: 11, border: 'none', backgroundColor: '#e4e5e7' }}>{customVariants.length}</Tag>
        </span>
      ),
      children: (
        <div style={{ paddingTop: 16 }}>
          {customVariants.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e1e3e5',
                borderRadius: 8,
                padding: '48px 20px',
                textAlign: 'center',
              }}
            >
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
          ) : (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e1e3e5',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
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
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#202223', fontSize: 20 }}>
          Alert Settings
        </Title>
        <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
          Configure threshold rules that trigger inventory warnings.
        </Text>
      </div>

      <Tabs defaultActiveKey="store-wide" items={items} />
    </div>
  )
}

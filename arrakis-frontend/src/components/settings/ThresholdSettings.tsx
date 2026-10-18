import React, { useState } from 'react'
import { Button, InputNumber, Typography, message } from 'antd'

const { Title, Text } = Typography

interface ThresholdSettingsProps {
  initialThreshold: number
  onSave: (threshold: number) => void
}

export const ThresholdSettings: React.FC<ThresholdSettingsProps> = ({
  initialThreshold,
  onSave,
}) => {
  const [val, setVal] = useState<number>(initialThreshold)

  const handleSave = () => {
    onSave(val)
    message.success('Threshold setting saved successfully')
  }

  return (
    <div style={{ maxWidth: 460, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#202223' }}>
          Low Inventory Threshold Configuration
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Set the inventory quantity limit below which items display as low stock alerts.
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
        onClick={handleSave}
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
  )
}

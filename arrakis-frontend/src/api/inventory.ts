import { api } from './client'
import type { components } from '../types/api-schema'

export type ProductResponse = components['schemas']['ProductResponse']
export type VariantResponse = components['schemas']['VariantResponse']
export type CustomThresholdVariant = components['schemas']['CustomThresholdVariantDto']
export type LocationItem = components['schemas']['LocationDto']
export type PageProductResponse = components['schemas']['PageProductResponse']
export type MetricsResponse = components['schemas']['MetricsResponse']
export type SyncResponse = components['schemas']['SyncResponse']
export type SettingResponse = components['schemas']['SettingDto']

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch('/api/health')
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  return response.json()
}

export async function fetchProducts(
  page: number,
  locationId: string,
  threshold?: number,
  lowStockOnly: boolean = false
): Promise<PageProductResponse> {
  const { data, error } = await api.GET('/api/products', {
    params: {
      query: {
        page,
        size: 10,
        locationId,
        threshold,
        lowStockOnly,
      },
    },
  })
  if (error) throw error
  return data
}

export async function fetchMetrics(
  locationId: string,
  threshold?: number
): Promise<MetricsResponse> {
  const { data, error } = await api.GET('/api/metrics', {
    params: {
      query: {
        locationId,
        threshold,
      },
    },
  })
  if (error) throw error
  return data
}

export async function fetchLocations(): Promise<LocationItem[]> {
  const { data, error } = await api.GET('/api/locations')
  if (error) throw error
  return data
}

export async function syncInventory(): Promise<SyncResponse> {
  const { data, error } = await api.POST('/api/sync')
  if (error) throw error
  return data
}

export async function fetchSettings(): Promise<SettingResponse> {
  const { data, error } = await api.GET('/api/settings')
  if (error) throw error
  return data
}

export async function updateSettings(threshold: number): Promise<SettingResponse> {
  const { data, error } = await api.PUT('/api/settings', {
    body: { threshold },
  })
  if (error) throw error
  return data
}

export async function fetchCustomThresholdVariants(): Promise<CustomThresholdVariant[]> {
  const { data, error } = await api.GET('/api/variants/custom-thresholds')
  if (error) throw error
  return data
}

export async function updateVariantThreshold(
  variantId: string,
  threshold: number | null,
  locationId?: string
): Promise<VariantResponse> {
  const response = await fetch('/api/variants/threshold', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      variantId,
      threshold: threshold ?? undefined,
      locationId: locationId || 'ALL',
    }),
  })
  if (!response.ok) {
    throw new Error('Failed to update variant threshold')
  }
  return response.json()
}

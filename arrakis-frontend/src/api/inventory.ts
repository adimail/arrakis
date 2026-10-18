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

export async function fetchProducts(
  page: number,
  locationId: string,
  threshold: number,
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
  threshold: number
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
  const { data, error } = await api.POST('/api/settings', {
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
  threshold: number | null
): Promise<VariantResponse> {
  const { data, error } = await api.PUT('/api/variants/{variantId}/threshold', {
    params: {
      path: { variantId },
    },
    body: { threshold: threshold ?? undefined },
  })
  if (error) throw error
  return data
}

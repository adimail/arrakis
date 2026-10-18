import { CustomThresholdVariant, LocationItem, PageProductResponse, VariantResponse } from '../types/inventory'

const BASE_URL = 'http://localhost:8080/api'

export async function fetchProducts(
  page: number,
  locationId: string,
  threshold: number,
  lowStockOnly: boolean = false
): Promise<PageProductResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: '10',
    locationId,
    threshold: threshold.toString(),
    lowStockOnly: lowStockOnly.toString(),
  })
  const res = await fetch(`${BASE_URL}/products?${params}`)
  if (!res.ok) throw new Error('Failed to load products')
  return res.json()
}

export async function fetchMetrics(
  locationId: string,
  threshold: number
): Promise<{ lowStockCount: number; threshold: number }> {
  const params = new URLSearchParams({
    locationId,
    threshold: threshold.toString(),
  })
  const res = await fetch(`${BASE_URL}/metrics?${params}`)
  if (!res.ok) throw new Error('Failed to load metrics')
  return res.json()
}

export async function fetchLocations(): Promise<LocationItem[]> {
  const res = await fetch(`${BASE_URL}/locations`)
  if (!res.ok) throw new Error('Failed to load locations')
  return res.json()
}

export async function syncInventory(): Promise<{ message: string; syncedProductsCount: number; syncedAt?: string }> {
  const res = await fetch(`${BASE_URL}/sync`, { method: 'POST' })
  if (!res.ok) throw new Error('Sync failed')
  return res.json()
}

export async function fetchSettings(): Promise<{ threshold: number }> {
  const res = await fetch(`${BASE_URL}/settings`)
  if (!res.ok) throw new Error('Failed to load settings')
  return res.json()
}

export async function updateSettings(threshold: number): Promise<{ threshold: number }> {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold }),
  })
  if (!res.ok) throw new Error('Failed to save settings')
  return res.json()
}

export async function fetchCustomThresholdVariants(): Promise<CustomThresholdVariant[]> {
  const res = await fetch(`${BASE_URL}/variants/custom-thresholds`)
  if (!res.ok) throw new Error('Failed to load custom thresholds')
  return res.json()
}

export async function updateVariantThreshold(
  variantId: string,
  threshold: number | null
): Promise<VariantResponse> {
  const params = new URLSearchParams({ variantId })
  const res = await fetch(`${BASE_URL}/variants/threshold?${params}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threshold }),
  })
  if (!res.ok) throw new Error('Failed to update variant threshold')
  return res.json()
}

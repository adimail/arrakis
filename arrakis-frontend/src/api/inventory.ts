import { LocationItem, PageProductResponse } from '../types/inventory'

const BASE_URL = 'http://localhost:8080/api'

export async function fetchProducts(
  page: number,
  locationId: string,
  threshold: number
): Promise<PageProductResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: '10',
    locationId,
    threshold: threshold.toString(),
  })
  const res = await fetch(`${BASE_URL}/products?${params}`)
  if (!res.ok) throw new Error('Failed to load products')
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

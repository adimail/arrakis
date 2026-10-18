export interface VariantResponse {
  id: string
  title: string
  sku?: string
  price?: string
  inventoryQuantity: number
  alertThreshold?: number | null
  isLowInventory: boolean
}

export interface CustomThresholdVariant {
  variantId: string
  variantTitle: string
  productTitle: string
  sku?: string
  price?: string
  alertThreshold: number
}

export interface ProductResponse {
  id: string
  title: string
  vendor?: string
  productType?: string
  status?: string
  imageUrl?: string
  totalInventory: number
  isLowInventory: boolean
  variants: VariantResponse[]
}

export interface PageProductResponse {
  totalElements: number
  totalPages: number
  size: number
  number: number
  content: ProductResponse[]
  first: boolean
  last: boolean
  empty: boolean
}

export interface LocationItem {
  id: string
  name: string
}

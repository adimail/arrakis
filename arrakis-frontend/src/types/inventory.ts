export interface VariantResponse {
  id: string
  title: string
  sku: string
  price: string
  inventoryQuantity: number
}

export interface ProductResponse {
  id: string
  title: string
  vendor: string
  productType: string
  status: string
  totalInventory: number
  isLowInventory: boolean
  variants: VariantResponse[]
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
}

export interface LocationItem {
  id: string
  name: string
}

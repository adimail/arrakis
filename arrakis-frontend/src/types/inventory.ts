import { components } from './api-schema'

export type ProductResponse = components['schemas']['ProductResponse']
export type VariantResponse = components['schemas']['VariantResponse']
export type PageProductResponse = components['schemas']['PageProductResponse']

export interface LocationItem {
  id: string
  name: string
}

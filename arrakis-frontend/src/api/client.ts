import createClient from 'openapi-fetch'
import type { paths } from '../types/api-schema'

export const api = createClient<paths>({
  baseUrl: 'http://localhost:8080',
})

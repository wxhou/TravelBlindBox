export interface POI {
  id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  category: string
  rating?: number
  price?: string
  telephone?: string
  photos?: string[]
  tag?: string
  source?: 'amap' | 'cache' | 'mcp'
}

export interface POIActivity {
  id: string
  name: string
  description: string
  poi?: POI
  duration?: string
  cost?: number
  imageUrl?: string
}

export interface POIMeal {
  id: string
  name: string
  description: string
  poi?: POI
  type: '早餐' | '午餐' | '晚餐' | '小吃'
  cost?: number
  imageUrl?: string
}

export interface POIAccommodation {
  id: string
  name: string
  description: string
  poi?: POI
  cost?: number
  rating?: number
  imageUrl?: string
}

export interface TravelParams {
  departureDate: string
  departureCity: string
  budgetMin: number
  budgetMax: number
  destinationPreference: '城市' | '自然' | '美食' | '文化' | '冒险'
  duration: number
  transportation: '飞机' | '火车' | '自驾' | '公交'
}

export interface ItineraryDay {
  day: number
  activities: string[]
  meals: string[]
  accommodation?: string
  imageUrl?: string
  imageQuery?: string
  poiActivities?: POIActivity[]
  poiMeals?: POIMeal[]
  poiAccommodation?: POIAccommodation
}

export interface TravelRoute {
  id: string
  title: string
  description: string
  totalCost: number
  duration: number
  highlights: string[]
  itinerary: ItineraryDay[]
  theme: string
  coverImageUrl?: string
  coverImageQuery?: string
  pois?: {
    attractions?: POI[]
    hotels?: POI[]
    restaurants?: POI[]
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

export interface OpenAIError {
  message: string
  type: string
  code?: string
}

export interface StoredRoute extends TravelRoute {
  id: string
  savedAt: string
  status: 'revealed' | 'scheduled'
  userNotes?: string
  generationParams?: TravelParams
}

export interface RouteHistoryFilters {
  status?: 'revealed' | 'scheduled' | 'all'
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
}

export interface RouteStorageConfig {
  maxAgeDays: number
  maxRecords: number
  enableCompression: boolean
}

export interface StorageStats {
  totalRecords: number
  storageUsed: number
  oldestRecord?: string
  newestRecord?: string
}

export const StorageErrorCode = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SERIALIZATION_FAILED: 'SERIALIZATION_FAILED',
  INVALID_DATA: 'INVALID_DATA',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
} as const

export type StorageErrorCode = typeof StorageErrorCode[keyof typeof StorageErrorCode]

export interface StorageError extends Error {
  code: StorageErrorCode
  originalError?: Error
}
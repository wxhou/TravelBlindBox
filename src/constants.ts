export const DESTINATION_PREFERENCES = [
  '城市',
  '自然',
  '美食',
  '文化',
  '冒险'
] as const

export const TRANSPORTATION_OPTIONS = [
  '飞机',
  '火车',
  '自驾',
  '公交'
] as const

export const BUDGET_RANGES = [
  { label: '¥500-1000', min: 500, max: 1000 },
  { label: '¥1000-2000', min: 1000, max: 2000 },
  { label: '¥2000-3000', min: 2000, max: 3000 },
  { label: '¥3000-5000', min: 3000, max: 5000 },
  { label: '¥5000-8000', min: 5000, max: 8000 },
  { label: '¥8000-12000', min: 8000, max: 12000 },
  { label: '¥12000-18000', min: 12000, max: 18000 },
  { label: '¥18000-25000', min: 18000, max: 25000 },
  { label: '¥25000-35000', min: 25000, max: 35000 },
  { label: '¥35000+', min: 35000, max: 50000 }
]

export const DURATION_OPTIONS = [
  { label: '1-2天', value: 2 },
  { label: '3-5天', value: 5 },
  { label: '6-10天', value: 10 },
  { label: '10天以上', value: 15 }
]

export const ROUTE_THEMES = [
  '经典观光',
  '深度体验',
  '美食之旅',
  '休闲度假',
  '探险挑战'
]
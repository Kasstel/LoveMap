export type MemoryCategory =
  | 'date'
  | 'travel'
  | 'food'
  | 'concert'
  | 'home'
  | 'adventure'
  | 'milestone'

export interface Coords{
  lat: number
  lng: number
}

export interface Memory {
  id: string
  couple_id: string
  title: string
  description: string | null
  date: string
  category: MemoryCategory
  emoji: string | null
  lat: number
  lng: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MemoryPhoto {
  id: string
  memory_id: string
  url: string
  storage_path: string
  position: number
  created_at: string
}

export interface CoupleInfo {
  id: string
  partner_1: string
  partner_2: string
  start_date: string
  invite_code: string
  created_by: string
  created_at: string
}

export type NewMemory = Pick<
  Memory,
  'title' | 'description' | 'date' | 'category' | 'emoji' | 'lat' | 'lng'
>

export const CATEGORY_MAP: Record<
  MemoryCategory,
  { emoji: string; label: string; color: string }
> = {
  date: { emoji: '💕', label: 'Свидание', color: '#f472b6' },
  travel: { emoji: '✈️', label: 'Путешествие', color: '#60a5fa' },
  food: { emoji: '🍽️', label: 'Еда', color: '#fb923c' },
  concert: { emoji: '🎵', label: 'Концерт', color: '#a78bfa' },
  home: { emoji: '🏠', label: 'Дом', color: '#4ade80' },
  adventure: { emoji: '🏔️', label: 'Приключение', color: '#facc15' },
  milestone: { emoji: '⭐', label: 'Веха', color: '#f87171' },
}

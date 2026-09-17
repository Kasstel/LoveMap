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

// приглушённая чернильная гамма одной насыщенности (раздел «Категории» в CLAUDE.md);
// белый текст на плашках — не color-on-primary, а отдельный #FBF5EA по той же спецификации
export const CATEGORY_MAP: Record<
  MemoryCategory,
  { emoji: string; label: string; color: string }
> = {
  date: { emoji: '💕', label: 'Свидание', color: '#8C3350' },      // винный: сливовый #6E3B55 сливался с concert и travel под сепией
  travel: { emoji: '✈️', label: 'Путешествие', color: '#3E5068' }, // индиго
  food: { emoji: '🍽️', label: 'Еда', color: '#B08544' },           // охра
  concert: { emoji: '🎵', label: 'Концерт', color: '#594271' },    // приглушённый фиолетовый
  home: { emoji: '🏠', label: 'Дом', color: '#6B7043' },           // оливковый
  adventure: { emoji: '🏔️', label: 'Приключение', color: '#3C674B' }, // хвойный зелёный
  milestone: { emoji: '⭐', label: 'Веха', color: '#A63A2B' },     // кирпичный
}

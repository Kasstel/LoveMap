import { useMemoryStore } from '../../stores/memoryStore'
import { CATEGORY_MAP, type Memory } from '../../types'
import { formatDate } from '../../utils/dates'
import { useEffect, useRef } from 'react'

interface MemoryCardProps {
  memory: Memory
  isActive: boolean
  onSelect: (memoryId: string) => void
}

export function MemoryCard({ memory, isActive, onSelect }: MemoryCardProps){
  const category = CATEGORY_MAP[memory.category]
  // селектор возвращает строку, а не массив: карточка перерисуется,
  // только если сменилось именно её первое фото, а не фото любого воспоминания
  const coverUrl = useMemoryStore((state) => state.photos[memory.id]?.[0]?.url)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isActive) {
      buttonRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isActive])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => onSelect(memory.id)}
      // рамка есть всегда (у неактивных прозрачная) — иначе при выделении карточка прыгала бы на 1px
      className={`flex w-full gap-3 rounded-card border p-2 text-left transition-colors ${
        isActive ? 'border-primary-muted bg-tint' : 'border-transparent hover:bg-tint/60'
      }`}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-control object-cover"
        />
      ) : (
        // цвет категории известен только во время работы — Tailwind не создаст для него класс, поэтому style
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control text-2xl"
          style={{ backgroundColor: category.color }}
        >
          {category.emoji}
        </div>
      )}

      {/* min-w-0: без него длинное название растянет карточку, и truncate не сработает */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{memory.title}</div>
        <div className="mt-0.5 text-xs text-ink-subtle">
          {category.emoji} {formatDate(memory.date)}
        </div>
        {memory.description && (
          <div className="mt-1 line-clamp-2 text-xs text-ink-muted">{memory.description}</div>
        )}
      </div>
    </button>
  )
}

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
      className={`flex w-full gap-3 rounded-card border bg-surface p-3 text-left transition-colors ${
        isActive ? 'border-primary-muted bg-tint' : 'border-transparent hover:bg-tint/60'
      }`}
    >
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-control border border-line object-cover"
        />
      ) : (
        // цвет категории известен только во время работы — Tailwind не создаст для него класс, поэтому style
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-control border border-line text-2xl"
          style={{ backgroundColor: category.color }}
        >
          {category.emoji}
        </div>
      )}

      {/* min-w-0: без него длинное название растянет карточку, и truncate не сработает */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm text-ink">{memory.title}</div>
        <div className="mt-0.5 text-xs text-ink-muted">{formatDate(memory.date)}</div>

        <div className="mt-1.5 border-t border-line-soft" />

        <span
          className="mt-1.5 inline-block rounded-control px-1.5 py-0.5 text-[10px] leading-none"
          style={{ backgroundColor: category.color, color: '#FBF5EA' }}
        >
          {category.label}
        </span>

        {memory.description && (
          <div className="mt-1 line-clamp-2 text-xs text-ink-muted">{memory.description}</div>
        )}
      </div>
    </button>
  )
}

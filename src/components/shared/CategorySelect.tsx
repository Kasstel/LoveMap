import { useEffect, useId, useRef, useState } from "react"
import { CATEGORY_MAP, type MemoryCategory } from "../../types"
import { MEMORY_CATEGORIES } from "../../utils/categories"

interface CategorySelectProps {
  id?: string
  value: MemoryCategory
  onChange: (category: MemoryCategory) => void
}

// нативный <select> не умеет показывать цветную точку категории рядом с названием —
// поэтому свой список поверх кнопки, а не select с перекрашенной стрелкой
export function CategorySelect({ id, value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = CATEGORY_MAP[value]

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative mt-1">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex w-full items-center gap-2 rounded-control border border-line bg-paper px-3 py-2 text-left text-sm text-ink focus:border-primary focus:outline-none"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
        <span className="flex-1 truncate">{selected.label}</span>
        <svg viewBox="0 0 12 8" className="h-2 w-3 shrink-0 text-ink-faint" aria-hidden="true">
          <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" id={listId} className="absolute z-10 mt-1 w-full overflow-hidden rounded-control border border-line bg-surface shadow-panel">
          {MEMORY_CATEGORIES.map((key) => (
            <li key={key} role="option" aria-selected={key === value}>
              <button
                type="button"
                onClick={() => { onChange(key); setOpen(false) }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-tint ${
                  key === value ? 'bg-tint' : ''
                }`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_MAP[key].color }} />
                <span>{CATEGORY_MAP[key].label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

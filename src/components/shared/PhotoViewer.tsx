import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MemoryPhoto } from '../../types'

interface PhotoViewerProps {
  photos: MemoryPhoto[]
  startIndex: number
  title?: string
  onClose: () => void
}

// минимальный сдвиг пальца в px, чтобы считать жест свайпом, а не случайным касанием
const SWIPE_THRESHOLD = 50

// по кругу: с последнего фото «вперёд» — на первое, с первого «назад» — на последнее
function wrapIndex(index: number, count: number): number {
  return (index + count) % count
}

const navButtonClassName =
  'absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-3xl text-white hover:bg-white/25'

export function PhotoViewer({ photos, startIndex, title, onClose }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  const count = photos.length
  const hasMany = count > 1

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && count > 1) {
        setIndex((current) => wrapIndex(current - 1, count))
      } else if (event.key === 'ArrowRight' && count > 1) {
        setIndex((current) => wrapIndex(current + 1, count))
      } else {
        return
      }
      // Leaflet слушает клавиатуру на document, пока карта в фокусе:
      // без этого стрелки сдвинут карту под окном, а Escape закроет ещё и попап
      event.stopPropagation()
      event.preventDefault()
    }

    // true — фаза перехвата: window получает событие раньше document, где его ждёт Leaflet
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [onClose, count])

  if (count === 0) {
    return null
  }

  // список мог уменьшиться, пока окно открыто — не выходим за его конец
  const photo = photos[Math.min(index, count - 1)]

  function showPrevious(event: React.MouseEvent) {
    event.stopPropagation()
    setIndex((current) => wrapIndex(current - 1, count))
  }

  function showNext(event: React.MouseEvent) {
    event.stopPropagation()
    setIndex((current) => wrapIndex(current + 1, count))
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return

    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null

    if (!hasMany || Math.abs(deltaX) < SWIPE_THRESHOLD) return

    // палец вправо — предыдущее фото, как листание в галерее iPhone
    if (deltaX > 0) {
      setIndex((current) => wrapIndex(current - 1, count))
    } else {
      setIndex((current) => wrapIndex(current + 1, count))
    }
  }

  // портал в body: у слоёв Leaflet есть transform, и fixed внутри попапа
  // растянулся бы на слой карты, а не на весь экран
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Просмотр фото'}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
    >
      <img
        key={photo.id}
        src={photo.url}
        alt={title ?? ''}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-control object-contain select-none"
      />

      <button
        type="button"
        autoFocus
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white hover:bg-white/25"
      >
        ✕
      </button>

      {hasMany && (
        <>
          <button type="button" aria-label="Предыдущее фото" onClick={showPrevious} className={`${navButtonClassName} left-4`}>
            ‹
          </button>
          <button type="button" aria-label="Следующее фото" onClick={showNext} className={`${navButtonClassName} right-4`}>
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
            {Math.min(index, count - 1) + 1} / {count}
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}

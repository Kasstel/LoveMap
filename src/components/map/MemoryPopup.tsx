import { useEffect, useState } from 'react'
import { useMemoryStore } from '../../stores/memoryStore'
import type { Memory, MemoryPhoto } from '../../types'
import { CATEGORY_MAP } from '../../types'
import { formatDate } from '../../utils/dates'
import { PhotoViewer } from '../shared/PhotoViewer'
import { useMapStore } from '../../stores/mapStore'


interface MemoryPopupProps {
  memory: Memory
}


export function MemoryPopup({ memory }: MemoryPopupProps) {
  const category = CATEGORY_MAP[memory.category]
  const photos = useMemoryStore<MemoryPhoto[] | undefined>((state)=>state.photos[memory.id])
  const fetchPhotos = useMemoryStore((state)=> state.fetchPhotos)
  const removeMemory = useMemoryStore((state)=> state.removeMemory)
  
  const [deleting, setDeleting] = useState(false)
  // индекс фото, открытого на весь экран; null — окно закрыто
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  useEffect(()=>{
    if (photos === undefined){
      fetchPhotos(memory.id)
    }
  }, [photos, memory.id, fetchPhotos])

  async function handleDelete() {
  const photoNote = photos && photos.length > 0 ? `\nФото (${photos.length}) тоже удалятся.` : ''
  // удаление нельзя отменить — спрашиваем. confirm блокирует страницу, пока не ответишь
  if (!window.confirm(`Удалить «${memory.title}»?${photoNote}`)) {
    return
  }

  setDeleting(true)
  const removed = await removeMemory(memory.id)

  if (!removed) {
    setDeleting(false)
    window.alert(useMemoryStore.getState().error ?? 'Не получилось удалить воспоминание')
    return
  }

  // успех: воспоминание пропало из стора → пин и этот попап исчезнут сами.
  // выбор сбрасываем явно — не надеемся, что popupclose успеет сработать при удалении маркера
  if (useMapStore.getState().activeMemoryId === memory.id) {
    useMapStore.getState().setActiveMemoryId(null)
  }
}

  return (
    <div className="w-56">
      <span
        className="inline-block rounded-control px-1.5 py-0.5 text-[10px] leading-none"
        style={{ backgroundColor: category.color, color: '#FBF5EA' }}
      >
        {category.label}
      </span>

      <div className="mt-2 font-display text-base text-ink">{memory.title}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{formatDate(memory.date)}</div>

      {memory.description && (
        <div className="mt-2 text-sm whitespace-pre-line text-ink-soft">{memory.description}</div>
      )}

      {photos === undefined && (
        <div className="mt-2 h-32 w-full animate-pulse rounded-control bg-muted" />
      ) 
      }

      {photos && photos.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setViewerIndex(0)} className="block w-full cursor-zoom-in">
            <img
              src={photos[0].url}
              alt={memory.title}
              loading="lazy"
              className="h-32 w-full rounded-control border border-line object-cover"
            />
          </button>

          {photos.length > 1 && (
            <div className="mt-1 flex gap-1 overflow-x-auto">
              {photos.slice(1).map((photo, sliceIndex) => (
                // slice(1) начинает счёт заново с нуля — в общем списке это фото под номером +1
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setViewerIndex(sliceIndex + 1)}
                  className="shrink-0 cursor-zoom-in"
                >
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="h-12 w-12 rounded-control border border-line object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {photos && viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          startIndex={viewerIndex}
          title={memory.title}
          onClose={() => setViewerIndex(null)}
        />
      )}

      <div className="mt-3 flex justify-between border-t border-line-soft pt-2">
        <button
          type="button"
          // экшен прямо из getState: попапу не нужно перерисовываться из-за mapStore
          onClick={() => useMapStore.getState().setEditingMemoryId(memory.id)}
          disabled={deleting}
          className="rounded-control border border-line px-2 py-1 text-xs text-ink-soft hover:bg-tint disabled:opacity-50"
        >
          Изменить
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-control border border-line px-2 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50"
        >
          {deleting ? 'Удаляем...' : 'Удалить'}
        </button>
      </div>
    </div>
  )
}

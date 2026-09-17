import { useEffect, useState } from "react";
import { useMemoryStore } from "../../stores/memoryStore";
import { CATEGORY_MAP, type Coords, type Memory, type MemoryCategory, type MemoryPhoto } from "../../types";
import { MEMORY_CATEGORIES } from "../../utils/categories";
import { toDateInputValue } from "../../utils/dates";
import type { CompressedPhoto } from "../../utils/photos";
import { PhotoUpload } from "../shared/PhotoUpload";

interface MemoryFormModalProps {
  coords: Coords
  // передали — режим редактирования: поля заполнены, сохранение вызывает updateMemory
  memory?: Memory
  onClose: () => void
}

const MAX_PHOTOS = 10

const fieldClassName = "mt-1 w-full rounded-control border border-line px-3 py-2 text-sm text-ink"

// Одна форма на добавление и редактирование: поля, проверки и разметка одинаковые,
// различаются начальные значения, заголовок и то, что вызывается при сохранении
export function MemoryFormModal({coords, memory, onClose}: MemoryFormModalProps){
  const isEdit = memory !== undefined

  // начальные значения читаются только при монтировании — поэтому MainLayout
  // монтирует форму заново на каждое открытие (условный рендер + key)
  const [title, setTitle] = useState(memory?.title ?? '')
  const [description, setDescription] = useState(memory?.description ?? '')
  const today = toDateInputValue(new Date())
  const [date, setDate] = useState(() => memory?.date ?? toDateInputValue(new Date()))
  const [category, setCategory] = useState<MemoryCategory>(memory?.category ?? 'date')
  const [submitted, setSubmitted] = useState(false)

  const [photos ,setPhotos] = useState<CompressedPhoto[]>([])
  const [photosProcessing, setPhotosProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null)

  const addMemory = useMemoryStore((state)=> state.addMemory)
  const updateMemory = useMemoryStore((state)=> state.updateMemory)
  const uploadPhoto = useMemoryStore((state)=> state.uploadPhoto)
  const removePhoto = useMemoryStore((state)=> state.removePhoto)
  const fetchPhotos = useMemoryStore((state)=> state.fetchPhotos)
  const error = useMemoryStore((state)=> state.error)

  const memoryId = memory?.id
  // уже загруженные фото — только при редактировании; undefined без memory или если ещё не загружены
  const existingPhotos = useMemoryStore<MemoryPhoto[] | undefined>((state)=>
    memoryId ? state.photos[memoryId] : undefined
  )
  const existingCount = existingPhotos?.length ?? 0

  // воспоминание прилетело через real-time — его фото в сторе ещё нет
  useEffect(()=>{
    if (memoryId && existingPhotos === undefined){
      fetchPhotos(memoryId)
    }
  }, [memoryId, existingPhotos, fetchPhotos])

  const busy = saving || removingPhotoId !== null

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setSaving(true)

    const fields = {
      title: title.trim(),
      description: description.trim() || null,
      date: date,
      category: category,
    }

    // координаты и emoji при редактировании не трогаем — передаём только поля формы
    const saved = memory
      ? await updateMemory(memory.id, fields)
      : await addMemory({ ...fields, emoji: null, lat: coords.lat, lng: coords.lng })

    if (!saved) {
      setSaving(false)
      return
    }

    let failedCount = 0
    for (const photo of photos){
      const uploaded = await uploadPhoto(saved.id, photo.file)
      if (!uploaded){
        failedCount+=1
      }
    }
    if (failedCount > 0) {
      window.alert(`Воспоминание сохранено, но не загрузилось фото: ${failedCount}`)
    }
    onClose()
  }

  // уже загруженное фото удаляется сразу, не дожидаясь «Сохранить»: это отдельное действие
  async function handleRemoveExisting(photo: MemoryPhoto) {
    if (!window.confirm('Удалить это фото? Отменить будет нельзя.')) {
      return
    }
    setRemovingPhotoId(photo.id)
    const removed = await removePhoto(photo.id)
    setRemovingPhotoId(null)
    if (!removed) {
      window.alert(useMemoryStore.getState().error ?? 'Не получилось удалить фото')
    }
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4">
      {/* max-h + overflow: с фото форма бывает выше экрана телефона */}
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-panel bg-surface p-6 shadow-modal">
        <h3 className="font-display text-lg font-semibold text-primary">
          {isEdit ? 'Изменить воспоминание' : 'Новое воспоминание'}
        </h3>
        <div className="mt-0.5 text-xs text-ink-faint">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label className="block text-sm text-ink-muted">
            Название
            <input
              required
              value={title}
              onChange={(event)=> setTitle(event.target.value)}
              placeholder="Первое свидание"
              className={fieldClassName}
            />
          </label>

          <label className="mt-3 block text-sm text-ink-muted">
            Описание
            <textarea
              rows={3}
              value={description}
              onChange={(event)=> setDescription(event.target.value)}
              placeholder="Можешь придумать описание, если хочешь)"
              className={`${fieldClassName} resize-none`}
            />
          </label>

          <div className="mt-3 flex gap-3">
            <label className="block flex-1 text-sm text-ink-muted">
              Дата
              <input
                type="date"
                required
                max={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClassName}
              />
            </label>

            <label className="block flex-1 text-sm text-ink-muted">
              Категория
              <select
                value={category}
                onChange={(event)=> setCategory(event.target.value as MemoryCategory)}
                className={fieldClassName}
              >
                {MEMORY_CATEGORIES.map((key)=> (
                  <option key={key} value={key}>
                    {CATEGORY_MAP[key].emoji} {CATEGORY_MAP[key].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isEdit && existingCount > 0 && existingPhotos && (
            <div className="mt-3">
              <div className="text-sm text-ink-muted">Фото</div>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt=""
                      className={`aspect-square w-full rounded-control object-cover ${
                        removingPhotoId === photo.id ? 'opacity-40' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(photo)}
                      disabled={busy}
                      aria-label="Удалить фото"
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <PhotoUpload
              photos={photos}
              onChange={setPhotos}
              onProcessingChange={setPhotosProcessing}
              // лимит общий: уже загруженные + новые
              maxPhotos={MAX_PHOTOS - existingCount}
              disabled={busy}
            />
          </div>

          {submitted && error && <div className="mt-3 text-sm text-danger">{error}</div>}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-control border border-line py-2 text-sm text-primary hover:bg-tint"
              disabled={busy}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={busy || photosProcessing}
              className="flex-1 rounded-control bg-primary py-2 text-sm text-on-primary disabled:bg-primary-disabled"
            >
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

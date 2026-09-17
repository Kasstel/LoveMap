import { useEffect, useId, useState } from "react";
import { useMemoryStore } from "../../stores/memoryStore";
import { useMapStore } from "../../stores/mapStore";
import type { Coords, Memory, MemoryCategory, MemoryPhoto } from "../../types";
import { toDateInputValue } from "../../utils/dates";
import type { CompressedPhoto } from "../../utils/photos";
import { PhotoUpload } from "../shared/PhotoUpload";
import { CategorySelect } from "../shared/CategorySelect";
import { DeckleEdge } from "../shared/DeckleEdge";

interface MemoryFormModalProps {
  coords: Coords
  // передали — режим редактирования: поля заполнены, сохранение вызывает updateMemory
  memory?: Memory
  onClose: () => void
}

const MAX_PHOTOS = 10

const fieldClassName = "mt-1 w-full rounded-control border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
const labelClassName = "block text-sm text-ink-soft"

// Одна форма на добавление и редактирование: поля, проверки и разметка одинаковые,
// различаются начальные значения, заголовок и то, что вызывается при сохранении
export function MemoryFormModal({coords, memory, onClose}: MemoryFormModalProps){
  const isEdit = memory !== undefined
  const categorySelectId = useId()

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
  const [deleting, setDeleting] = useState(false)
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null)

  const addMemory = useMemoryStore((state)=> state.addMemory)
  const updateMemory = useMemoryStore((state)=> state.updateMemory)
  const removeMemory = useMemoryStore((state)=> state.removeMemory)
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

  const busy = saving || deleting || removingPhotoId !== null

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

  async function handleDeleteMemory() {
    if (!memory) return
    if (!window.confirm(`Удалить «${memory.title}»? Отменить будет нельзя.`)) {
      return
    }
    setDeleting(true)
    const removed = await removeMemory(memory.id)
    if (!removed) {
      setDeleting(false)
      window.alert(useMemoryStore.getState().error ?? 'Не получилось удалить воспоминание')
      return
    }
    if (useMapStore.getState().activeMemoryId === memory.id) {
      useMapStore.getState().setActiveMemoryId(null)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-muted/35 p-4">
      {/* тень — на внешней обёртке: clip-path у DeckleEdge обрезал бы box-shadow */}
      <div className="relative z-10 max-h-full w-full max-w-md shadow-modal">
        {/* max-h + overflow: с фото форма бывает выше экрана телефона.
            деккельные края сверху и снизу — лист бумаги поверх карты */}
        <DeckleEdge edges={['top', 'bottom']} className="max-h-full overflow-y-auto rounded-panel bg-surface p-6">
        <h3 className="font-display text-lg text-ink">
          {isEdit ? 'Изменить воспоминание' : 'Новое воспоминание'}
        </h3>
        <div className="mt-0.5 text-xs text-ink-faint">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label className={labelClassName}>
            Название
            <input
              required
              value={title}
              onChange={(event)=> setTitle(event.target.value)}
              placeholder="Первое свидание"
              className={fieldClassName}
            />
          </label>

          <label className={`mt-3 ${labelClassName}`}>
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
            <label className={`flex-1 ${labelClassName}`}>
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

            <div className={`flex-1 ${labelClassName}`}>
              <label htmlFor={categorySelectId}>Категория</label>
              <CategorySelect id={categorySelectId} value={category} onChange={setCategory} />
            </div>
          </div>

          {isEdit && existingCount > 0 && existingPhotos && (
            <div className="mt-3">
              <div className={labelClassName}>Фото</div>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt=""
                      className={`aspect-square w-full rounded-control border border-line object-cover ${
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
            {isEdit && (
              <button
                type="button"
                onClick={handleDeleteMemory}
                disabled={busy}
                className="rounded-control border border-line px-3 text-sm text-danger hover:bg-danger-soft disabled:opacity-50"
              >
                {deleting ? 'Удаляем...' : 'Удалить'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-control border border-line py-2 text-sm text-ink-soft hover:bg-tint disabled:opacity-50"
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
        </DeckleEdge>
      </div>
    </div>
  )
}

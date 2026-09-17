import { useState } from "react";
import { compressImage, type CompressedPhoto } from "../../utils/photos";

interface PhotoUploadProps{
  photos: CompressedPhoto[],
  onChange: (photos: CompressedPhoto[])=> void
  maxPhotos?: number
  disabled?: boolean
  onProcessingChange?: (processing: boolean) => void
}


export function PhotoUpload({photos, onChange, maxPhotos=10, disabled = false, onProcessingChange}: PhotoUploadProps){
  const [processing, setProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const locked = disabled || processing

  async function handleFiles(fileList: FileList): Promise<void> {
    const added: CompressedPhoto[] = []
    const failed: string[] = []
    const freeSlots = maxPhotos - photos.length
    const files = Array.from(fileList).slice(0, freeSlots)
    setProcessing(true)
    onProcessingChange?.(true)
    setError('')
    for (const file of files){
      try{
        const photo = await compressImage(file)
        added.push(photo)
      }
      catch{
        failed.push(file.name)  
      }
      
    }

    onChange([...photos, ...added])
    if (failed.length > 0) {
    setError(`Не получилось открыть: ${failed.join(', ')}`)
    }
    setProcessing(false)
    onProcessingChange?.(false)
  }

  function handleInputChanges(event: React.ChangeEvent<HTMLInputElement>){
    const fileList = event.target.files
    if (!fileList) return 

    handleFiles(fileList)
    event.target.value= ''
  }
 //с шага 4 продолжить
  function handleRemove(id: string) : void {
    onChange(photos.filter((photo) => photo.id !== id))
  }


  function handleDragOver(e: React.DragEvent){
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragDrop(e: React.DragEvent){
    e.preventDefault()
    setIsDragging(false)
    if (locked) return
    handleFiles(e.dataTransfer.files)
  }

  return(
    <div>
      <div>
        <label onDragOver={handleDragOver} onDragLeave={() => setIsDragging(false)}  onDrop={handleDragDrop}className={`block cursor-pointer rounded-card border-2 border-dashed p-4 text-center text-sm text-ink-muted ${
  isDragging ? 'border-primary bg-tint' : 'border-line'
}`}>
          <span className="pointer-events-none">{processing ? 'Обрабатываем фото...' : 'Нажми или перетащи фото сюда'}
          </span> <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleInputChanges}
            disabled = {locked}
          />
        </label>
        {photos.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img src={photo.previewUrl} alt="" className="aspect-square w-full rounded-control object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemove(photo.id)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    disabled={locked}
                  >
                    ✕
                  </button>
                </div>
              ))}
              
            </div>
          )}
          {error && <div className="mt-1 text-xs text-danger">{error}</div>}
      </div>
    </div>
  )
}
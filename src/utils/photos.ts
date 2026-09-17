export interface CompressedPhoto {
  id: string          // key для списка превью
  file: File          // сжатый JPEG — уходит в uploadPhoto
  previewUrl: string  // data URL для <img src>, освобождать не нужно (в отличие от createObjectURL)
}

// Windows часто отдаёт у .heic пустой file.type, поэтому смотрим ещё и на расширение
function looksLikeImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    // JPEG/PNG/WebP везде, HEIC — в Safari (в том числе на iPhone)
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Chrome/Firefox/Edge не умеют HEIC. Декодер весит ~3 МБ, поэтому грузим его
    // динамическим import() только сейчас — Vite вынесет его в отдельный файл
    const { isHeic, heicTo } = await import('heic-to')

    if (!(await isHeic(file))) {
      throw new Error(`Не получилось открыть «${file.name}»: формат не поддерживается`)
    }

    return heicTo({ blob: file, type: 'bitmap' })
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  // toBlob работает через колбэк — оборачиваем в Promise, чтобы можно было await
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Браузер не смог сжать фото'))),
      'image/jpeg',
      quality,
    )
  })
}

// canvas → ширина до maxWidth → JPEG. Маленькие фото не растягиваем
export async function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<CompressedPhoto> {
  if (!looksLikeImage(file)) {
    throw new Error(`«${file.name}» — не фото`)
  }

  const bitmap = await decodeImage(file)

  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Браузер не смог сжать фото')
  }

  // у JPEG нет прозрачности: без белой заливки прозрачный фон PNG станет чёрным
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  // исходник 12 Мп занимает в памяти ~50 МБ — освобождаем сразу, не дожидаясь сборщика мусора
  bitmap.close()

  const blob = await canvasToBlob(canvas, quality)

  return {
    id: crypto.randomUUID(),
    file: new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
    previewUrl: canvas.toDataURL('image/jpeg', quality),
  }
}

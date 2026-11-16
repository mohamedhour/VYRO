/** Client for the server-side Gemini virtual try-on image generation route. */
export class TryOnError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TryOnError'
  }
}

export const PROGRESS_STAGES = [
  'Analyzing your photo…',
  'Preparing your selected outfit…',
  'Creating your try-on image…',
  'Finishing your preview…',
]

const MAX_IMAGE_SIDE = 1024

async function toCompressedImage(source, fallbackName = 'image') {
  if (!source) throw new TryOnError(`A product image is missing for ${fallbackName}.`)

  let blob
  if (source.startsWith('data:image/')) {
    const response = await fetch(source)
    blob = await response.blob()
  } else {
    const response = await fetch(source)
    if (!response.ok) throw new TryOnError(`Could not load the image for ${fallbackName}.`)
    blob = await response.blob()
  }

  if (!blob.type.startsWith('image/')) throw new TryOnError(`The image for ${fallbackName} could not be read.`)

  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new TryOnError('Your browser could not prepare the images. Please try again.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.84)
  const comma = dataUrl.indexOf(',')
  return { mimeType: 'image/jpeg', data: dataUrl.slice(comma + 1) }
}

export async function generateTryOnPreview({ photo, selections, onProgress }) {
  if (!photo) throw new TryOnError('Upload a photo before generating your try-on.')

  const items = Object.values(selections).filter(Boolean)
  if (items.length === 0) throw new TryOnError('Select at least one item before generating your try-on.')

  onProgress?.(0)
  const compressedPhoto = await toCompressedImage(photo, 'your photo')
  onProgress?.(1)
  const garments = await Promise.all(items.map(async (item) => ({
    name: item.name,
    image: await toCompressedImage(item.imageUrl || item.image, item.name),
  })))

  onProgress?.(2)
  const progressTimer = window.setInterval(() => {
    onProgress?.(3)
    window.clearInterval(progressTimer)
  }, 9000)

  let response
  try {
    response = await fetch('/api/tryon/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: compressedPhoto, garments }),
    })
  } catch {
    throw new TryOnError('Could not reach the VYRO Fit image service. Make sure the app server is running and try again.')
  } finally {
    window.clearInterval(progressTimer)
  }

  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new TryOnError(result.error || 'Could not generate your try-on image. Please try again.')
  if (!result.image) throw new TryOnError('The image service returned an empty preview. Please try again.')

  return {
    mode: 'generated',
    photo: result.image,
    items,
    generatedAt: result.generatedAt || new Date().toISOString(),
  }
}

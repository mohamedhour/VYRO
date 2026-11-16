import { HERO_IMAGE_URL, PRODUCTS } from '../data/catalog'

const COLOR_SWATCHES = {
  black: '#171717',
  white: '#f8fafc',
  cream: '#f5ebdd',
  blue: '#2563eb',
  navy: '#1e3a8a',
  red: '#e11d48',
  green: '#15803d',
  olive: '#4d5b2b',
  grey: '#71717a',
  gray: '#71717a',
  brown: '#8b5e3c',
  beige: '#d6c2a1',
}

function parseList(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Some older product rows store sizes or colors as comma-separated text.
  }

  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function imageUrlFor(item, fallback) {
  const source = item.imageUrl || item.image_url || item.image || fallback
  if (!source) return ''
  if (/^(https?:|data:)/i.test(source)) return source

  try {
    // The database stores image paths served from the frontend's public folder.
    return new URL(source, window.location.origin).toString()
  } catch {
    return fallback || ''
  }
}

function categoryName(item, fallback) {
  const category = item.category_name || item.category
  if (typeof category === 'string' && category.trim()) return category.trim()
  if (category && typeof category.name === 'string') return category.name
  return fallback || 'Other'
}

function priceAmount(item, fallback = 0) {
  const direct = Number(item.priceMad ?? item.price_mad ?? item.priceValue ?? item.price_value)
  if (Number.isFinite(direct) && direct > 0) return direct

  const fromPrice = Number(String(item.price ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(fromPrice) && fromPrice > 0 ? fromPrice : fallback
}

export function productFromApi(item) {
  const local = PRODUCTS.find((product) => String(product.id) === String(item.id)) || {}
  const rawColors = parseList(item.colors)
  const colors = rawColors.length
    ? rawColors.map((color, index) => {
        if (typeof color === 'string') {
          const isHex = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.test(color)
          return {
            name: isHex ? `Color ${index + 1}` : color,
            hex: isHex ? color : COLOR_SWATCHES[color.toLowerCase()] || '#27272A',
          }
        }
        return {
          name: color.name || color.label || `Color ${index + 1}`,
          hex: color.hex || color.value || '#27272A',
          imageUrl: color.imageUrl || color.image_url || undefined,
        }
      })
    : local.colors || [{ name: 'Black', hex: '#171717' }]
  const sizes = parseList(item.sizes).map((size) => String(size))
  const imageUrl = imageUrlFor(item, local.imageUrl || HERO_IMAGE_URL)
  const priceMad = priceAmount(item, local.priceMad || 0)
  let stockBySize = item.stockBySize || item.stock_by_size || null
  if (typeof stockBySize === 'string') {
    try { stockBySize = JSON.parse(stockBySize) } catch { stockBySize = null }
  }
  const stock = Number(item.stock ?? item.stock_quantity ?? item.quantity_available)

  return {
    ...local,
    ...item,
    id: String(item.id),
    name: item.name || local.name || 'VYRO Product',
    category: categoryName(item, local.category),
    priceMad,
    priceValue: priceMad,
    price: item.price || `MAD ${priceMad.toLocaleString('en-US')}`,
    description: item.description || local.description || '',
    fabric: item.fabric || item.materials || item.material || local.fabric || 'VYRO selected materials',
    edition: item.edition || local.edition || (item.isNew || item.is_new ? 'Limited Drop' : 'In Stock'),
    colors,
    sizes: sizes.length ? sizes : local.sizes || ['One Size'],
    imageUrl,
    image: imageUrl,
    imagePosition: item.imagePosition || item.image_position || local.imagePosition || 'center',
    imageScale: item.imageScale || item.image_scale || local.imageScale || '',
    stock: Number.isFinite(stock) && stock >= 0 ? stock : undefined,
    stockBySize: stockBySize && typeof stockBySize === 'object' ? stockBySize : undefined,
  }
}

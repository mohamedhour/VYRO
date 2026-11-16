import { PRODUCTS, LOOKS, getProduct } from './products'

/**
 * A "slot" is one garment role in an outfit. Each maps to one or more
 * product categories so Step 02 can offer the right products under
 * Top / Bottom / Jacket / Shoes / Accessories.
 */
export const SLOTS = [
  { key: 'top', label: 'Top', categories: ['T-Shirts', 'Hoodies'] },
  { key: 'bottom', label: 'Bottom', categories: ['Pants'] },
  { key: 'jacket', label: 'Jacket', categories: ['Jackets'] },
  { key: 'shoes', label: 'Shoes', categories: ['Shoes'] },
  { key: 'accessories', label: 'Accessories', categories: ['Accessories'] },
]

export function productsForSlot(slotKey, products = PRODUCTS) {
  return products.filter((product) => slotKeyForProduct(product) === slotKey)
}

export function slotKeyForProduct(product) {
  if (!product) return null
  const exactSlot = SLOTS.find((slot) => slot.categories.includes(product.category))
  if (exactSlot) return exactSlot.key

  const category = String(product.category || '').toLowerCase()
  const name = String(product.name || '').toLowerCase()
  const searchable = `${category} ${name}`

  if (/shoe|footwear|sneaker|boot|chauss|basket/.test(searchable)) return 'shoes'
  if (/accessor|accessoire|bag|cap|hat|sac|casquette/.test(searchable)) return 'accessories'
  if (/pant|bottom|trouser|jean|short|cargo|pantalon|bas/.test(searchable)) return 'bottom'
  if (/jacket|coat|outerwear|vest|manteau|veste|bomber/.test(searchable)) return 'jacket'
  return 'top'
}

/** Ordered list of { slot, product } for every currently-filled slot. */
export function filledSlots(selections) {
  return SLOTS.map((slot) => ({ slot, product: selections[slot.key] ?? null })).filter(
    (entry) => entry.product
  )
}

/**
 * Recommends companion products for the current selections, e.g.
 * selecting the Drift Hoodie surfaces the rest of its curated look
 * (Utility Cargo, Vector Runner, Signal Cap). Falls back to one popular
 * item per still-empty slot when nothing selected matches a curated look.
 */
export function getRecommendations(selections, count = 3) {
  const selectedIds = Object.values(selections)
    .filter(Boolean)
    .map((p) => p.id)

  if (selectedIds.length > 0) {
    let bestLook = null
    let bestScore = 0
    for (const look of LOOKS) {
      const score = look.items.filter((id) => selectedIds.includes(id)).length
      if (score > bestScore) {
        bestScore = score
        bestLook = look
      }
    }
    if (bestLook) {
      const fromLook = bestLook.items
        .map(getProduct)
        .filter(Boolean)
        .filter((p) => !selectedIds.includes(p.id))
      if (fromLook.length > 0) return fromLook.slice(0, count)
    }
  }

  // Fallback: one item per empty slot, favoring highly-rated new arrivals.
  const emptySlots = SLOTS.filter((slot) => !selections[slot.key])
  const fallback = emptySlots
    .map((slot) => {
      const candidates = productsForSlot(slot.key).filter((p) => !selectedIds.includes(p.id))
      return [...candidates].sort((a, b) => b.rating - a.rating)[0]
    })
    .filter(Boolean)
  return fallback.slice(0, count)
}

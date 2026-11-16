import { garmentPlaceholder } from './placeholder'

const COLORS = {
  black: { name: 'Black', hex: '#141416' },
  white: { name: 'White', hex: '#ededec' },
  navy: { name: 'Navy', hex: '#1f2b42' },
  olive: { name: 'Olive', hex: '#4a5230' },
  charcoal: { name: 'Charcoal', hex: '#2e2e31' },
  sand: { name: 'Sand', hex: '#c9b895' },
  grey: { name: 'Grey', hex: '#7d7d80' },
}

function gallery(type) {
  return [
    garmentPlaceholder(type, 'mute'),
    garmentPlaceholder(type, 'accent'),
    garmentPlaceholder(type, 'white'),
  ]
}

export const PRODUCTS = [
  {
    id: 'nova-overcoat',
    name: 'Nova Overcoat',
    description:
      'A full-length wool-blend overcoat cut for a clean, structured silhouette. Built for cold commutes and layering over tailoring.',
    materials: '72% wool, 25% polyester, 3% elastane. Fully lined.',
    category: 'Jackets',
    price: 'MAD 6,200',
    priceValue: 6200,
    type: 'coat',
    image: garmentPlaceholder('coat', 'mute'),
    imageHover: garmentPlaceholder('coat', 'accent'),
    images: gallery('coat'),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [COLORS.black, COLORS.charcoal],
    stock: 8,
    rating: 4.8,
    reviewCount: 96,
    isNew: true,
  },
  {
    id: 'axis-blazer',
    name: 'Axis Blazer',
    description:
      'Single-breasted blazer in a soft-structured wool blend. Slim through the body with a natural shoulder line.',
    materials: '68% wool, 30% polyester, 2% elastane. Half-canvassed construction.',
    category: 'Jackets',
    price: 'MAD 4,850',
    priceValue: 4850,
    type: 'jacket',
    image: garmentPlaceholder('jacket', 'mute'),
    imageHover: garmentPlaceholder('jacket', 'accent'),
    images: gallery('jacket'),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [COLORS.navy, COLORS.black],
    stock: 5,
    rating: 4.6,
    reviewCount: 142,
    isNew: true,
  },
  {
    id: 'field-jacket',
    name: 'Field Jacket',
    description:
      'Cotton-canvas field jacket with a four-pocket front and a matte corozo button placket. Built to weather.',
    materials: '100% cotton canvas, brushed cotton lining.',
    category: 'Jackets',
    price: 'MAD 3,600',
    priceValue: 3600,
    type: 'jacket',
    image: garmentPlaceholder('jacket', 'mute'),
    imageHover: garmentPlaceholder('jacket', 'accent'),
    images: gallery('jacket'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [COLORS.olive, COLORS.black],
    stock: 0,
    rating: 4.3,
    reviewCount: 58,
    isNew: false,
  },
  {
    id: 'strata-shirt',
    name: 'Strata Shirt',
    description:
      'A structured cotton-poplin shirt with a clean point collar. Cut close through the waist without pulling at the shoulders.',
    materials: '100% cotton poplin.',
    category: 'T-Shirts',
    price: 'MAD 950',
    priceValue: 950,
    type: 'shirt',
    image: garmentPlaceholder('shirt', 'mute'),
    imageHover: garmentPlaceholder('shirt', 'accent'),
    images: gallery('shirt'),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [COLORS.white, COLORS.black],
    stock: 14,
    rating: 4.4,
    reviewCount: 87,
    isNew: false,
  },
  {
    id: 'core-tee',
    name: 'Core Tee',
    description:
      'Heavyweight cotton tee with a boxier fit and reinforced collar seam. The everyday layer under everything else.',
    materials: '100% combed cotton, 220gsm jersey.',
    category: 'T-Shirts',
    price: 'MAD 480',
    priceValue: 480,
    type: 'tshirt',
    image: garmentPlaceholder('tshirt', 'mute'),
    imageHover: garmentPlaceholder('tshirt', 'accent'),
    images: gallery('tshirt'),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [COLORS.white, COLORS.black, COLORS.grey],
    stock: 20,
    rating: 4.5,
    reviewCount: 211,
    isNew: true,
  },
  {
    id: 'form-trouser',
    name: 'Form Trouser',
    description:
      'Tapered wool-blend trouser with a mid-rise waist and a clean front. Tailored enough for the office, relaxed enough without it.',
    materials: '70% wool, 28% polyester, 2% elastane.',
    category: 'Pants',
    price: 'MAD 1,650',
    priceValue: 1650,
    type: 'trousers',
    image: garmentPlaceholder('trousers', 'mute'),
    imageHover: garmentPlaceholder('trousers', 'accent'),
    images: gallery('trousers'),
    sizes: ['28', '30', '32', '34', '36'],
    colors: [COLORS.black, COLORS.sand],
    stock: 10,
    rating: 4.4,
    reviewCount: 73,
    isNew: true,
  },
  {
    id: 'utility-cargo',
    name: 'Utility Cargo',
    description:
      'Straight-leg cargo pant in brushed cotton twill, with articulated knees and a hidden interior pocket.',
    materials: '100% cotton twill.',
    category: 'Pants',
    price: 'MAD 1,450',
    priceValue: 1450,
    type: 'trousers',
    image: garmentPlaceholder('trousers', 'mute'),
    imageHover: garmentPlaceholder('trousers', 'accent'),
    images: gallery('trousers'),
    sizes: ['28', '30', '32', '34'],
    colors: [COLORS.olive, COLORS.black],
    stock: 6,
    rating: 4.1,
    reviewCount: 39,
    isNew: false,
  },
  {
    id: 'mono-knit',
    name: 'Mono Knit',
    description:
      'Fine-gauge merino knit with a ribbed hem and cuff. Layers cleanly under the Axis Blazer or worn alone.',
    materials: '100% merino wool.',
    category: 'Hoodies',
    price: 'MAD 1,380',
    priceValue: 1380,
    type: 'knit',
    image: garmentPlaceholder('knit', 'mute'),
    imageHover: garmentPlaceholder('knit', 'accent'),
    images: gallery('knit'),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [COLORS.grey, COLORS.navy],
    stock: 0,
    rating: 4.0,
    reviewCount: 24,
    isNew: false,
  },
  {
    id: 'drift-hoodie',
    name: 'Drift Hoodie',
    description:
      'Heavyweight brushed-fleece hoodie with a dropped shoulder and a fixed drawcord hood. Off-duty, not sloppy.',
    materials: '80% cotton, 20% polyester brushed fleece, 420gsm.',
    category: 'Hoodies',
    price: 'MAD 1,150',
    priceValue: 1150,
    type: 'hoodie',
    image: garmentPlaceholder('hoodie', 'mute'),
    imageHover: garmentPlaceholder('hoodie', 'accent'),
    images: gallery('hoodie'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [COLORS.black, COLORS.grey, COLORS.sand],
    stock: 15,
    rating: 4.7,
    reviewCount: 168,
    isNew: true,
  },
  {
    id: 'vector-runner',
    name: 'Vector Runner',
    description:
      'Minimal low-top trainer in a smooth leather upper with a lightweight rubber sole. Built to go with everything above it.',
    materials: 'Leather upper, rubber outsole, cushioned foam midsole.',
    category: 'Shoes',
    price: 'MAD 2,450',
    priceValue: 2450,
    type: 'sneaker',
    image: garmentPlaceholder('sneaker', 'mute'),
    imageHover: garmentPlaceholder('sneaker', 'accent'),
    images: gallery('sneaker'),
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: [COLORS.white, COLORS.black],
    stock: 9,
    rating: 4.6,
    reviewCount: 104,
    isNew: false,
  },
  {
    id: 'trail-sneaker',
    name: 'Trail Sneaker',
    description:
      'Rugged low-top with a lugged outsole and abrasion-resistant panels, without tipping into full hiking-boot territory.',
    materials: 'Textile and synthetic upper, rubber lugged outsole.',
    category: 'Shoes',
    price: 'MAD 2,150',
    priceValue: 2150,
    type: 'sneaker',
    image: garmentPlaceholder('sneaker', 'mute'),
    imageHover: garmentPlaceholder('sneaker', 'accent'),
    images: gallery('sneaker'),
    sizes: ['40', '41', '42', '43', '44'],
    colors: [COLORS.black, COLORS.grey],
    stock: 4,
    rating: 4.2,
    reviewCount: 31,
    isNew: true,
  },
  {
    id: 'transit-bag',
    name: 'Transit Bag',
    description:
      'Structured leather tote with a padded laptop sleeve and a magnetic top closure. Fits a full day without bulking up.',
    materials: 'Full-grain leather, cotton-twill lining.',
    category: 'Accessories',
    price: 'MAD 2,900',
    priceValue: 2900,
    type: 'bag',
    image: garmentPlaceholder('bag', 'mute'),
    imageHover: garmentPlaceholder('bag', 'accent'),
    images: gallery('bag'),
    sizes: ['One Size'],
    colors: [COLORS.black, COLORS.sand],
    stock: 12,
    rating: 4.9,
    reviewCount: 65,
    isNew: false,
  },
  {
    id: 'signal-cap',
    name: 'Signal Cap',
    description:
      'Six-panel cap in washed cotton twill with a curved brim and an adjustable strap. The finishing piece on a low-key look.',
    materials: '100% cotton twill, adjustable strap.',
    category: 'Accessories',
    price: 'MAD 380',
    priceValue: 380,
    type: 'cap',
    image: garmentPlaceholder('cap', 'mute'),
    imageHover: garmentPlaceholder('cap', 'accent'),
    images: gallery('cap'),
    sizes: ['One Size'],
    colors: [COLORS.black, COLORS.navy, COLORS.olive],
    stock: 25,
    rating: 4.3,
    reviewCount: 47,
    isNew: true,
  },
]

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id)
}

export function getRelatedProducts(product, count = 4) {
  if (!product) return []
  const sameCategory = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id)
  const rest = PRODUCTS.filter((p) => p.category !== product.category && p.id !== product.id)
  return [...sameCategory, ...rest].slice(0, count)
}

export function getCompleteTheLookMatches(product, count = 3) {
  if (!product) return []
  return PRODUCTS.filter((p) => p.category !== product.category && p.id !== product.id).slice(0, count)
}

export const CATEGORIES = [
  { name: 'T-Shirts', slug: 't-shirts', type: 'tshirt' },
  { name: 'Hoodies', slug: 'hoodies', type: 'hoodie' },
  { name: 'Jackets', slug: 'jackets', type: 'jacket' },
  { name: 'Pants', slug: 'pants', type: 'trousers' },
  { name: 'Shoes', slug: 'shoes', type: 'sneaker' },
  { name: 'Accessories', slug: 'accessories', type: 'bag' },
].map((c) => ({
  ...c,
  image: garmentPlaceholder(c.type, 'mute'),
  imageHover: garmentPlaceholder(c.type, 'accent'),
}))

export const LOOKS = [
  {
    id: 'studio-01',
    title: 'Studio 01',
    description: 'Axis Blazer, Strata Shirt, Form Trouser',
    price: 'From MAD 7,450',
    items: ['axis-blazer', 'strata-shirt', 'form-trouser'],
  },
  {
    id: 'off-duty-02',
    title: 'Off Duty 02',
    description: 'Drift Hoodie, Form Trouser, Vector Runner',
    price: 'From MAD 5,250',
    items: ['drift-hoodie', 'form-trouser', 'vector-runner'],
  },
  {
    id: 'transit-03',
    title: 'Transit 03',
    description: 'Nova Overcoat, Core Tee, Transit Bag',
    price: 'From MAD 9,580',
    items: ['nova-overcoat', 'core-tee', 'transit-bag'],
  },
  {
    id: 'off-grid-04',
    title: 'Off Grid 04',
    description: 'Drift Hoodie, Utility Cargo, Vector Runner, Signal Cap',
    price: 'From MAD 6,530',
    items: ['drift-hoodie', 'utility-cargo', 'vector-runner', 'signal-cap'],
  },
]

export const REVIEWS = [
  {
    name: 'Yassine B.',
    location: 'Casablanca',
    rating: 5,
    quote:
      'Uploaded one photo and saw the overcoat fit before it shipped. First time I have bought outerwear online without any doubt about sizing.',
  },
  {
    name: 'Sara El M.',
    location: 'Rabat',
    rating: 5,
    quote:
      'VYRO Fit is the reason I stopped ordering two sizes of everything. The preview matched what arrived almost exactly.',
  },
  {
    name: 'Karim T.',
    location: 'Marrakech',
    rating: 4,
    quote:
      'Look Builder helped me put a full outfit together in minutes. The Axis Blazer looks even better in person.',
  },
]

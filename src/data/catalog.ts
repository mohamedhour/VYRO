export type ProductCategory =
  | 'All'
  | 'Hoodies'
  | 'Outerwear'
  | 'Bottoms'
  | 'Footwear'
  | 'Accessories'
  | 'Tees';

export type ApparelSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type KidSize = string;

export interface ProductColor {
  name: string;
  hex: string;
  /** Dedicated product photo for this colorway, when available. */
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  priceMad: number;
  edition: string;
  description: string;
  fabric: string;
  colors: ProductColor[];
  sizes: KidSize[];
  imageUrl: string;
  imagePosition: string;
  imageScale?: string;
  stock?: number;
  stockBySize?: Record<string, number>;
}

export interface HeroSlide {
  index: string;
  kicker: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  featuredProductId: string;
}

export const HERO_IMAGE_URL = '/assets/aistudio/VYRO_FASHION_campaign.png';

export const HERO_SLIDES: HeroSlide[] = [
  {
    index: '01',
    kicker: 'VYRO FASHION',
    titleLead: 'Dress The',
    titleAccent: 'Future',
    subtitle: 'More than clothes. A lifestyle for the next generation.',
    featuredProductId: 'vyro-cyber-hoodie',
  },
];

export const PRODUCTS: Product[] = [
  {
    id: 'vyro-cyber-hoodie',
    name: 'VYRO 480gsm Boxy Oversized Hoodie',
    category: 'Hoodies',
    priceMad: 690,
    edition: 'Limited Drop',
    description:
      'Heavyweight 480gsm washed-black French terry hoodie with dropped shoulders, boxy cropped drape, and metallic VYRO chest crest.',
    fabric: '100% Heavyweight Combed Cotton (480gsm)',
    colors: [
      { name: 'Washed Obsidian', hex: '#181A20' },
      { name: 'Crimson Ash', hex: '#E11D48' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_oversized_hoodie.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-cargo-pant',
    name: 'Parachute Tactical Wide Cargo Pants',
    category: 'Bottoms',
    priceMad: 640,
    edition: 'In Stock',
    description:
      'Relaxed wide-leg parachute cargo trousers in charcoal ripstop nylon with articulated knees, crimson utility straps, and toggle cuffs.',
    fabric: '94% Ripstop Technical Nylon, 6% Elastane',
    colors: [
      { name: 'Charcoal Ripstop', hex: '#1C1E24' },
      { name: 'Stealth Black', hex: '#0F1117' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_tech_cargo.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-aero-bomber',
    name: 'Cropped Boxy Flight Bomber Jacket',
    category: 'Outerwear',
    priceMad: 1190,
    edition: 'Limited Drop',
    description:
      'Architectural cropped-waist oversized flight bomber in matte-black twill with quilted crimson thermal lining and MA-1 sleeve pocket.',
    fabric: '100% Water-Repellent Matte Flight Twill',
    colors: [
      { name: 'Matte Black / Crimson', hex: '#14161D' },
      { name: 'Deep Slate', hex: '#27272A' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_bomber_jacket.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-velocity-high',
    name: 'Apex Chunky Runner Sneakers',
    category: 'Footwear',
    priceMad: 980,
    edition: 'Limited Drop',
    description:
      'Sculpted oversized runner silhouette with multi-layered mesh & leather upper, chunky EVA lugged sole, and crimson heel cage.',
    fabric: 'Full-Grain Nubuck, Ballistic Mesh & Dual-Density EVA',
    colors: [
      { name: 'Obsidian / Chalk / Crimson', hex: '#E11D48' },
      { name: 'Triple Black', hex: '#18181B' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_chunky_sneakers.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-oversized-tee',
    name: 'Acid-Wash Drop-Shoulder Heavy Tee',
    category: 'Tees',
    priceMad: 390,
    edition: 'In Stock',
    description:
      'Boxy oversized 300gsm vintage acid-wash charcoal tee with wide rib collar and futuristic crimson chest typography.',
    fabric: '100% Organic Carded Cotton (300gsm)',
    colors: [
      { name: 'Acid Charcoal', hex: '#27272A' },
      { name: 'Jet Black', hex: '#111318' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_oversized_tee.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-full-kit',
    name: 'VYRO Complete Oversized 4-Piece Fit',
    category: 'Hoodies',
    priceMad: 2190,
    edition: 'Limited Drop',
    description:
      'Full contemporary street uniform: 480gsm Boxy Hoodie, Parachute Wide Cargo Pants, Apex Chunky Sneakers, and Crossbody Tech Bag.',
    fabric: '480gsm French Terry & Ripstop Technical Nylon',
    colors: [{ name: 'Signature Obsidian / Crimson', hex: '#E11D48' }],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_full_oversized_fit.jpg',
    imagePosition: '50% 25%',
  },
  {
    id: 'vyro-hero-campaign-fit',
    name: 'VYRO Hero Campaign Full Outfit',
    category: 'Hoodies',
    priceMad: 1890,
    edition: 'Campaign Look',
    description:
      'The signature VYRO FASHION hero look: Reflective VYRO Hoodie, Tactical Cargo Pants, Crimson/Chalk High-Tops, and Stealth V-Cap.',
    fabric: 'Heavyweight Tech-Fleece, Ripstop Twill & Full-Grain Leather',
    colors: [
      { name: 'Campaign Black / Crimson', hex: '#E11D48' },
      { name: 'Obsidian Edition', hex: '#141720' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_campaign_full_outfit.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-campaign-hoodie-solo',
    name: 'VYRO Signature Reflective Hoodie',
    category: 'Hoodies',
    priceMad: 740,
    edition: 'Campaign Piece',
    description:
      'The exact oversized black hoodie from the VYRO campaign featuring bold white VYRO chest typography, contrast red stitching, and sleeve utility pocket.',
    fabric: '100% Heavyweight Tech-Fleece Cotton (460gsm)',
    colors: [
      { name: 'Obsidian / White', hex: '#141720' },
      { name: 'Crimson Stitch', hex: '#E11D48' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_campaign_hoodie_solo.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-campaign-pants-solo',
    name: 'VYRO Tactical Campaign Cargo Pants',
    category: 'Bottoms',
    priceMad: 690,
    edition: 'Campaign Piece',
    description:
      'The signature black tactical cargo trousers from the VYRO campaign with gusseted thigh pockets, white VYRO branding, and tapered ankle cuffs.',
    fabric: '96% Combed Ripstop Cotton, 4% Elastane',
    colors: [
      { name: 'Obsidian Black', hex: '#12141A' },
      { name: 'Graphite', hex: '#27272A' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_campaign_pants_solo.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-campaign-sneakers-solo',
    name: 'VYRO V-Crest High-Top Sneakers',
    category: 'Footwear',
    priceMad: 990,
    edition: 'Campaign Piece',
    description:
      'The signature black, chalk-white, and crimson high-top sneakers from the VYRO campaign with bold V-emblem tongue and cushioned court sole.',
    fabric: 'Full-Grain Leather & Breathable Technical Mesh',
    colors: [
      { name: 'Obsidian / Chalk / Crimson', hex: '#E11D48' },
      { name: 'Stealth Black', hex: '#18181B' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_campaign_sneakers_solo.jpg',
    imagePosition: '50% 50%',
  },
  {
    id: 'vyro-campaign-cap-solo',
    name: 'VYRO Stealth V-Emblem Cap',
    category: 'Accessories',
    priceMad: 290,
    edition: 'Campaign Piece',
    description:
      'Structured 6-panel black cap from the VYRO campaign featuring a 3D metallic-white V-insignia and micro-adjustable rear strap.',
    fabric: '100% Brushed Technical Twill',
    colors: [
      { name: 'Obsidian Black', hex: '#111318' },
      { name: 'Crimson Edition', hex: '#E11D48' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    imageUrl: '/assets/products/vyro_campaign_cap_solo.jpg',
    imagePosition: '50% 50%',
  },
];

export const CATEGORIES: ProductCategory[] = [
  'All',
  'Hoodies',
  'Outerwear',
  'Bottoms',
  'Footwear',
  'Accessories',
  'Tees',
];

export const MOROCCO_CITIES = [
  'Casablanca',
  'Rabat',
  'Salé',
  'Témara',
  'Skhirat',
  'Mohammedia',
  'Bouskoura',
  'Berrechid',
  'Settat',
  'El Jadida',
  'Azemmour',
  'Safi',
  'Youssoufia',
  'Beni Mellal',
  'Khouribga',
  'Oued Zem',
  'Fquih Ben Salah',
  'Azilal',
  'Khenifra',
  'Marrakech',
  'Essaouira',
  'Chichaoua',
  'El Kelaa des Sraghna',
  'Tanger',
  'Tétouan',
  'M’diq',
  'Fnideq',
  'Chefchaouen',
  'Larache',
  'Ksar El Kebir',
  'Asilah',
  'Ouezzane',
  'Al Hoceima',
  'Targuist',
  'Nador',
  'Driouch',
  'Berkane',
  'Oujda',
  'Taourirt',
  'Guercif',
  'Jerada',
  'Figuig',
  'Fès',
  'Meknès',
  'Ifrane',
  'Azrou',
  'Sefrou',
  'Boulemane',
  'El Hajeb',
  'Taounate',
  'Taza',
  'Midelt',
  'Agadir',
  'Inezgane',
  'Aït Melloul',
  'Dcheira El Jihadia',
  'Biougra',
  'Taroudant',
  'Tiznit',
  'Sidi Ifni',
  'Guelmim',
  'Tan-Tan',
  'Tata',
  'Laâyoune',
  'Boujdour',
  'Dakhla',
  'Smara',
  'Ouarzazate',
  'Zagora',
  'Tinghir',
  'Errachidia',
  'Rissani',
  'Erfoud',
  'Tinejdad',
  'Goulmima',
  'Khemisset',
  'Sidi Slimane',
  'Sidi Kacem',
  'Kenitra',
  'Sidi Yahya El Gharb',
  'Souk El Arbaa',
  'Moulay Bousselham',
  'Benslimane',
  'Mediouna',
  'Nouaceur',
  'Had Soualem',
  'Ben Ahmed',
  'Oulad Teima',
  'Ait Ourir',
  'Ben Guerir',
  'Demnate',
  'Kasba Tadla',
  'Bejaad',
  'Boudnib',
  'Saidia',
  'Ahfir',
  'El Aioun Sidi Mellouk',
  'Zaio',
  'Bni Ansar',
  'Selouane',
  'Oulad Berhil',
  'Akhfenir',
  'Tarfaya',
  'Assa',
  'Zag',
];

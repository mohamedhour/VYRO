/**
 * Generates flat technical-sketch garment placeholders as inline SVG data
 * URIs. Used in place of real product photography, styled like the flat
 * garment schematics used in fashion technical packs — on-brand for a
 * fashion-tech product rather than a generic gray box.
 */

const PATHS = {
  jacket:
    'M60 40 L90 20 L120 40 L140 32 L155 65 L138 78 L138 190 L42 190 L42 78 L25 65 L40 32 Z M75 40 L75 110 M105 40 L105 110',
  coat:
    'M55 35 L90 15 L125 35 L148 55 L160 90 L142 100 L142 210 L38 210 L38 100 L20 90 L32 55 Z M90 15 L90 210',
  shirt:
    'M65 35 L90 22 L115 35 L150 55 L138 82 L120 70 L120 175 L60 175 L60 70 L42 82 L30 55 Z',
  trousers:
    'M55 25 L125 25 L130 100 L145 195 L115 195 L92 110 L88 195 L58 195 L48 100 Z',
  knit:
    'M62 38 L90 24 L118 38 L146 58 L132 84 L118 74 L118 180 L62 180 L62 74 L48 84 L34 58 Z M75 38 Q90 55 105 38',
  bag: 'M55 70 Q55 30 90 30 Q125 30 125 70 L138 70 L145 175 L35 175 L42 70 Z M70 70 Q70 50 90 50 Q110 50 110 70',
  tshirt:
    'M68 40 L90 30 L112 40 L145 52 L134 78 L118 68 L118 165 L62 165 L62 68 L46 78 L35 52 Z',
  hoodie:
    'M65 45 L90 26 L115 45 L148 60 L136 86 L120 76 L120 185 L60 185 L60 76 L44 86 L32 60 Z M78 45 Q90 68 102 45 M90 68 L90 100',
  sneaker:
    'M30 140 L30 120 L48 118 L62 106 L86 106 L96 116 L140 122 Q152 124 152 138 L152 150 L30 150 Z M62 106 L62 122 L96 122',
  cap: 'M40 120 Q40 70 90 70 Q140 70 140 120 L150 128 L120 128 M60 128 Q90 118 120 128 M40 120 L60 128',
}

const TONES = {
  mute: '#8b8b90',
  accent: '#9fe8ff',
  white: '#ededec',
}

export function garmentPlaceholder(type = 'jacket', tone = 'mute') {
  const path = PATHS[type] ?? PATHS.jacket
  const stroke = TONES[tone] ?? TONES.mute
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 220">
      <rect width="180" height="220" fill="#141416" />
      <path d="${path}" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" opacity="0.9" />
    </svg>
  `.trim()
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

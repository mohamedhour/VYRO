const VYRO_WHATSAPP_NUMBER = '212774570023';

export function openWhatsAppOrder(message: string): void {
  window.open(whatsAppOrderUrl(message), '_blank', 'noopener,noreferrer');
}

export function whatsAppOrderUrl(message: string): string {
  return `https://wa.me/${VYRO_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function productWhatsAppMessage({
  productName,
  colorName,
  size,
  priceMad,
  city,
  fullName,
  phone,
  address,
}: {
  productName: string;
  colorName: string;
  size: string;
  priceMad: number;
  city: string;
  fullName?: string;
  phone?: string;
  address?: string;
}): string {
  return [
    'Salam VYRO FASHION, bghit ndir commande:',
    ...(fullName ? [`• الاسم / Nom: ${fullName}`] : []),
    ...(phone ? [`• التيليفون / Téléphone: ${phone}`] : []),
    `• المنتوج / Produit: ${productName}`,
    `• اللون / Couleur: ${colorName}`,
    `• المقاس / Taille: ${size}`,
    `• الثمن / Prix: ${priceMad} MAD`,
    `• المدينة / Ville: ${city}`,
    ...(address ? [`• العنوان / Adresse: ${address}`] : []),
    'الخلاص ملي توصل السلعة / Paiement à la livraison, merci.',
  ].join('\n');
}

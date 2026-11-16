import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Check, MessageCircle, Flame } from 'lucide-react';
import { KidSize, MOROCCO_CITIES, Product } from '../data/catalog';
import { SafeImage } from './SafeImage';
import { useLocale } from '../context/LocaleContext';
import { openWhatsAppOrder, productWhatsAppMessage } from '../lib/whatsapp';

interface ProductDetailModalProps {
  product: Product | null;
  isCartOpen: boolean;
  isSaved: boolean;
  onClose: () => void;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (product: Product, size: KidSize, colorName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isCartOpen,
  isSaved,
  onClose,
  onToggleWishlist,
  onAddToCart,
}) => {
  const { t } = useLocale();
  const [selectedSize, setSelectedSize] = useState<KidSize>('M');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [orderCity, setOrderCity] = useState(MOROCCO_CITIES[0]);

  if (!product) return null;

  const activeSize = product.sizes.includes(selectedSize)
    ? selectedSize
    : product.sizes[0];
  const activeColor = product.colors[selectedColorIdx] ?? product.colors[0];

  const handleAdd = () => {
    onAddToCart(product, activeSize, activeColor.name);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };
  const handleWhatsAppOrder = () => openWhatsAppOrder(productWhatsAppMessage({
    productName: product.name,
    colorName: activeColor.name,
    size: activeSize,
    priceMad: product.priceMad,
    city: orderCity,
  }));
  const selectedSizeStock = product.stockBySize?.[activeSize] ?? product.stock;
  const hasScarcityBadge = ['limited drop', 'campaign look'].includes(product.edition.trim().toLowerCase());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0B0E16] border border-white/15 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col md:flex-row">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('product.close')}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#06070B]/80 border border-white/15 flex items-center justify-center text-zinc-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Left: Product Visual */}
        <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-[#07090F] relative overflow-hidden shrink-0">
          <SafeImage
            src={activeColor?.imageUrl ?? product.imageUrl}
            alt={`${product.name} — ${activeColor.name}`}
            className={`w-full h-full object-cover ${product.imageScale ?? ''}`}
            style={{ objectPosition: product.imagePosition }}
            fallbackLabel={product.category}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-transparent to-transparent opacity-60 md:hidden"
          />
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="w-full md:w-1/2 p-6 pb-36 sm:p-8 sm:pb-36 md:pb-8 overflow-y-auto flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-zinc-400 mb-1.5">
                <span>{t(`category.${product.category}`) === `category.${product.category}` ? product.category : t(`category.${product.category}`)}</span>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400">{product.edition}</span>
              </div>
              <h2
                id="pdp-title"
                className="font-product text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white"
              >
                {product.name}
              </h2>
              <p className="mt-2 inline-flex items-center gap-2">
                <span className="font-cyber text-lg sm:text-xl font-bold tracking-tight text-white">{product.priceMad}</span>
                <span className="rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-500">MAD</span>
              </p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>

            {/* Colorway Selector */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                {t('product.colorway')}: <span className="text-white">{activeColor.name}</span>
              </span>
              <div className="flex items-center gap-2.5">
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    aria-label={`${t('product.selectColor')} ${color.name}`}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      selectedColorIdx === idx
                        ? 'border-rose-500 scale-110'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>

            {selectedSizeStock === 0 ? (
              <p className="rounded-lg border border-rose-500/20 bg-rose-500/[0.07] px-3 py-2 text-xs font-medium text-rose-300">Sold out in {activeSize}</p>
            ) : hasScarcityBadge ? (
              <p aria-live="polite" className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3.5 py-3 text-xs font-medium text-amber-300">
                <Flame className="h-4 w-4 shrink-0 animate-pulse text-amber-400" aria-hidden="true" />
                <span>High Demand: Only 2 left in size {activeSize} for Morocco delivery</span>
              </p>
            ) : null}

            {/* Age Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {t('product.kidSize')}
                </span>
                <span className="text-xs text-zinc-400">{t('product.trueSize')}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((size) => {
                  const selected = activeSize === size;
                  const sizeUnavailable = (product.stockBySize?.[size] ?? product.stock) === 0;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      disabled={sizeUnavailable}
                      className={`py-2 text-xs font-mono-tabular font-semibold rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                        selected
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:border-white/30'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Material Spec */}
            <div className="pt-3 border-t border-white/[0.08] text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">{t('product.material')}: </span>
              {product.fabric}
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedSizeStock === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{t('product.added')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                  <span>{t('product.add')} — <span className="font-cyber text-xs font-bold">{product.priceMad}</span> <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">MAD</span></span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={isSaved ? t('product.removeSaved') : t('product.save')}
              className="p-3.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  isSaved ? 'fill-rose-500 text-rose-500' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
          <div className="space-y-2 border-t border-white/[0.08] pt-4">
            <label htmlFor="pdp-whatsapp-city" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Delivery city</label>
            <input id="pdp-whatsapp-city" list="pdp-morocco-city-list" value={orderCity} onChange={(event) => setOrderCity(event.target.value)} placeholder="Choose or type any Moroccan city" className="h-10 w-full rounded-lg border border-white/10 bg-[#080A10] px-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none" />
            <datalist id="pdp-morocco-city-list">
              {MOROCCO_CITIES.map((city) => <option key={city} value={city} />)}
            </datalist>
            <button type="button" onClick={handleWhatsAppOrder} className="hidden md:inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/[0.15]">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Quick Order via WhatsApp
            </button>
          </div>
        </div>
      </div>
      {!isCartOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 bg-[#08090E]/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl md:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <SafeImage
              src={activeColor?.imageUrl ?? product.imageUrl}
              alt={`${product.name} — ${activeColor.name}`}
              className="h-11 w-11 shrink-0 rounded-lg border border-white/10 object-cover"
              style={{ objectPosition: product.imagePosition }}
              fallbackLabel={product.category}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-product text-xs font-bold uppercase tracking-tight text-white">{product.name}</p>
              <p className="mt-1 flex items-center gap-1.5">
                <span className="font-cyber text-[10px] font-bold text-white">{product.priceMad}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">MAD</span>
              </p>
            </div>
            <label className="sr-only" htmlFor="mobile-quick-buy-size">Choose size</label>
            <select
              id="mobile-quick-buy-size"
              value={activeSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              className="h-10 w-[4.5rem] shrink-0 rounded-lg border border-white/15 bg-[#0B0E16] px-2 text-center text-xs font-bold text-white focus:border-rose-500 focus:outline-none"
            >
              {product.sizes.map((size) => (
                <option key={size} value={size} disabled={(product.stockBySize?.[size] ?? product.stock) === 0}>{size}</option>
              ))}
            </select>
          </div>
          <div className="mx-auto mt-2.5 grid max-w-xl grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={selectedSizeStock === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {justAdded ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
              <span>{justAdded ? 'Added ✓' : 'Add to Bag'}</span>
            </button>
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              aria-label="WhatsApp Quick Order"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/[0.16]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

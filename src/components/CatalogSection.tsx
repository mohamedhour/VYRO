import React, { useEffect, useState } from 'react';
import { Flame, Heart, Plus, X } from 'lucide-react';
import {
  CATEGORIES,
  KidSize,
  Product,
  ProductCategory,
} from '../data/catalog';
import { SafeImage } from './SafeImage';
import { useLocale } from '../context/LocaleContext';

interface CatalogSectionProps {
  products: Product[];
  categoryOptions?: string[];
  apiNotice?: string;
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  searchQuery: string;
  onClearSearch: () => void;
  showWishlistOnly: boolean;
  onClearWishlistFilter: () => void;
  wishlistIds: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product, size: KidSize, colorName: string) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  products,
  categoryOptions,
  apiNotice,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
  showWishlistOnly,
  onClearWishlistFilter,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}) => {
  const { locale, t } = useLocale();
  const categories = categoryOptions ?? CATEGORIES;
  const [selectedColorByProduct, setSelectedColorByProduct] = useState<Record<string, number>>({});
  const [selectedSizeByProduct, setSelectedSizeByProduct] = useState<Record<string, KidSize>>({});
  const [countdownNow, setCountdownNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const dropTimeLeft = Math.max(0, new Date('2026-12-15T18:00:00+01:00').getTime() - countdownNow);
  const countdownParts = [
    ['DAYS', Math.floor(dropTimeLeft / 86_400_000)],
    ['HRS', Math.floor((dropTimeLeft % 86_400_000) / 3_600_000)],
    ['MIN', Math.floor((dropTimeLeft % 3_600_000) / 60_000)],
    ['SEC', Math.floor((dropTimeLeft % 60_000) / 1000)],
  ] as const;

  return (
    <section
      id="shop"
      className="py-16 sm:py-24 bg-[#06070B] border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-rose-500/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(225,29,72,0.16),_transparent_55%),#0B0E16] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-400">Next Limited Drop · 15 Dec 2026</p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-wide text-white sm:text-xl">VYRO FW26 Cyber-Street Drop</h2>
              <p className="mt-1 text-xs text-zinc-400">New silhouettes. Limited quantities. Morocco delivery.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3" aria-label="Countdown to next drop">
              {countdownParts.map(([label, value]) => <div key={label} className="min-w-[3.6rem] rounded-lg border border-white/[0.08] bg-black/30 px-2 py-2 text-center sm:min-w-[4rem]"><span className="font-cyber block text-sm font-bold text-white sm:text-base">{String(value).padStart(2, '0')}</span><span className="text-[9px] font-semibold tracking-[0.16em] text-zinc-500">{label}</span></div>)}
            </div>
          </div>
        </div>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-rose-500 mb-2">
              {t('catalog.kicker')}
            </p>
            <h2
              className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {t('catalog.title')}
            </h2>
          </div>

          {/* Sort & Active Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {showWishlistOnly && (
              <button
                type="button"
                onClick={onClearWishlistFilter}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-300 bg-rose-600/15 border border-rose-500/30 rounded-lg hover:bg-rose-600/25 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t('catalog.saved')}</span>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}

            {searchQuery.trim() !== '' && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-200 bg-white/[0.06] border border-white/10 rounded-lg hover:bg-white/[0.12] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}

          </div>
        </div>

        {apiNotice && (
          <p role="status" className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200">
            {apiNotice}
          </p>
        )}

        {/* Interactive Category Filter Tabs */}
        <div
          role="tablist"
          aria-label={t('catalog.categories')}
          className="flex items-center gap-1.5 p-1.5 bg-[#0B0E16] border border-white/[0.07] rounded-xl overflow-x-auto mb-10 max-w-full"
        >
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectCategory(category)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                  active
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t(`category.${category}`) === `category.${category}` ? category : t(`category.${category}`)}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center border border-white/[0.07] rounded-2xl bg-[#0B0E16]/60">
            <p className="font-display text-lg font-semibold text-white mb-2">
              {t('catalog.empty')}
            </p>
            <p className="text-sm text-zinc-400 mb-6">
              {t('catalog.emptyHint')}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                onClearSearch();
                onClearWishlistFilter();
              }}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
            >
              {t('catalog.reset')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product) => {
              const isSaved = wishlistIds.includes(product.id);
              const selectedColorIdx = selectedColorByProduct[product.id] ?? 0;
              const activeColor = product.colors[selectedColorIdx] ?? product.colors[0];
              const fallbackSize = product.sizes.includes('M')
                ? 'M'
                : product.sizes[0];
              const selectedSize = selectedSizeByProduct[product.id] ?? fallbackSize;
              const cardStock = product.stockBySize?.[selectedSize] ?? product.stock;
              const hasScarcityBadge = ['limited drop', 'campaign look'].includes(product.edition.trim().toLowerCase());

              return (
                <article
                  key={product.id}
                  className="group flex flex-col bg-[#0B0E16] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                >
                  {/* Visual Slot (~70% card height) */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#090B11]">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="w-full h-full block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500"
                      aria-label={locale === 'ary' ? `${product.name} شوف التفاصيل` : locale === 'fr' ? `Voir les détails de ${product.name}` : `View details for ${product.name}`}
                    >
                      <SafeImage
                        src={activeColor?.imageUrl ?? product.imageUrl}
                        alt={`${product.name}${activeColor ? ` — ${activeColor.name}` : ''}`}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                          product.imageScale ?? ''
                        }`}
                        style={{ objectPosition: product.imagePosition }}
                        fallbackLabel={product.category}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#0B0E16] via-transparent to-black/20 opacity-75"
                      />
                    </button>

                    {/* Wishlist Toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleWishlist(product.id)}
                      aria-label={
                        isSaved
                          ? `${t('catalog.removeWishlist')} : ${product.name}`
                          : `${t('catalog.saveWishlist')} : ${product.name}`
                      }
                      className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#06070B]/75 backdrop-blur-md border border-white/15 flex items-center justify-center text-zinc-200 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Quick Add Action */}
                    <button
                      type="button"
                      disabled={cardStock === 0}
                      onClick={() => onQuickAdd(product, selectedSize, activeColor?.name ?? 'Default')}
                      className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#06070B]/85 hover:bg-rose-600 text-xs font-semibold text-white border border-white/15 hover:border-rose-500 backdrop-blur-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{t('catalog.quickAdd')} ({selectedSize})</span>
                    </button>
                  </div>

                  {/* Clean Unboxed Metadata */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      {product.colors.length > 0 && (
                        <div className="mb-3">
                          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <span>{t('product.colorway')}:</span>
                            <span className="text-zinc-200">{activeColor?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.colors.map((color, idx) => (
                              <button
                                key={color.name}
                                type="button"
                                onClick={() => setSelectedColorByProduct((current) => ({ ...current, [product.id]: idx }))}
                                aria-label={`${t('product.selectColor')} ${color.name}`}
                                aria-pressed={selectedColorIdx === idx}
                                className={`h-5 w-5 rounded-full border-2 transition-transform ${selectedColorIdx === idx ? 'scale-110 border-rose-500' : 'border-white/25 hover:border-white/60'}`}
                                style={{ backgroundColor: color.hex }}
                              />
                            ))}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Choose size">
                            {product.sizes.map((size) => {
                              const sizeStock = product.stockBySize?.[size] ?? product.stock;
                              const unavailable = sizeStock === 0;
                              return <button key={size} type="button" disabled={unavailable} onClick={() => setSelectedSizeByProduct((current) => ({ ...current, [product.id]: size }))} aria-pressed={selectedSize === size} className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${selectedSize === size ? 'border-rose-500/60 bg-rose-600/15 text-rose-200' : 'border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}>{size}</button>;
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-400 mb-1.5">
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-400">{product.edition}</span>
                      </div>

                      <h3 className="font-product text-base sm:text-lg font-extrabold uppercase tracking-tight text-white leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="text-left transition-colors focus-visible:outline-none focus-visible:underline group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-rose-200 group-hover:to-rose-500"
                        >
                          {product.name}
                        </button>
                      </h3>
                      {hasScarcityBadge && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400" aria-live="polite">
                          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                          Low Stock: Only 3 left in {selectedSize}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-cyber text-xs sm:text-sm font-bold tracking-tight text-white">{product.priceMad}</span>
                        <span className="rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-500">MAD</span>
                      </span>
                      <span className="text-xs text-zinc-400">
                        {t('catalog.sizes')} {product.sizes[0]}–
                        {product.sizes[product.sizes.length - 1]}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

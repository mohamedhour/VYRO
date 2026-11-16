import React from 'react';
import { ProductCategory } from '../data/catalog';
import { useLocale } from '../context/LocaleContext';

interface FooterProps {
  onSelectCategory: (category: ProductCategory) => void;
  onOpenFitStudio: () => void;
  categories?: string[];
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenFitStudio,
  categories,
}) => {
  const { t } = useLocale();
  const shopCategories = categories?.filter((category) => category !== 'All') ??
    ['Hoodies', 'Outerwear', 'Bottoms', 'Footwear', 'Accessories', 'Tees'];
  const handleCategoryJump = (cat: ProductCategory) => {
    onSelectCategory(cat);
    const el = document.getElementById('shop');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#06070B] border-t border-white/[0.07] py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/[0.06]">
          <div>
            <span className="font-display text-xl font-extrabold tracking-[0.14em] text-white block mb-3">
              VYRO
            </span>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
              {t('footer.shop')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              {(shopCategories as ProductCategory[]).map(
                (cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => handleCategoryJump(cat)}
                      className="hover:text-white transition-colors"
                    >
                      {t(`category.${cat}`) === `category.${cat}` ? cat : t(`category.${cat}`)}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
              {t('footer.experience')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenFitStudio}
                  className="hover:text-white transition-colors"
                >
                  VYRO Fit Studio
                </button>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  {t('footer.standard')}
                </a>
              </li>
              <li>
                <a href="#home" className="hover:text-white transition-colors">
                  {t('footer.lookbook')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
              {t('footer.care')}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              <li>{t('footer.cod')}</li>
              <li>{t('footer.shipping')}</li>
              <li>{t('footer.exchange')}</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} VYRO FASHION. {t('footer.rights')}</p>
          <p>Casablanca · Rabat · Marrakech · Tanger</p>
        </div>
      </div>
    </footer>
  );
};

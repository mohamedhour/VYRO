import React from 'react';
import {
  ArrowRight,
  ArrowDown,
  Shirt,
  Gem,
  ShieldCheck,
  Truck,
  Headphones,
} from 'lucide-react';
import { HERO_IMAGE_URL } from '../data/catalog';
import { SafeImage } from './SafeImage';
import { useLocale } from '../context/LocaleContext';

interface HeroSectionProps {
  onShopCollection: () => void;
  onOpenFitStudio: () => void;
}

const TRUST_ITEMS = [
  {
    icon: Gem,
    title: 'trust.quality',
    subtitle: 'trust.qualitySub',
  },
  {
    icon: ShieldCheck,
    title: 'trust.secure',
    subtitle: 'trust.secureSub',
  },
  {
    icon: Truck,
    title: 'trust.delivery',
    subtitle: 'trust.deliverySub',
  },
  {
    icon: Headphones,
    title: 'trust.support',
    subtitle: 'trust.supportSub',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopCollection,
  onOpenFitStudio,
}) => {
  const { t } = useLocale();
  return (
    <>
      <section
        id="home"
        className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-[#06070B]"
      >
      {/* Full-bleed campaign artwork */}
      <div className="absolute inset-0 z-0">
        <SafeImage
          src={HERO_IMAGE_URL}
          alt="VYRO FASHION campaign"
          className="h-full w-full object-cover object-center sm:object-[62%_center]"
        />
      </div>

      {/* Transparent hit areas align with the CTA artwork on tablet and desktop. */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
        <button
          type="button"
          onClick={onShopCollection}
          aria-label={t('hero.shop')}
          title={t('hero.shop')}
          className="pointer-events-auto absolute left-[4.8%] top-[65%] h-[7%] w-[12.8%] rounded-md bg-transparent focus-visible:outline-none"
        />
        <button
          type="button"
          onClick={onOpenFitStudio}
          aria-label={t('hero.fit')}
          title={t('hero.fit')}
          className="pointer-events-auto absolute left-[19.2%] top-[65%] h-[7%] w-[13.6%] rounded-md bg-transparent focus-visible:outline-none"
        />
      </div>

      {/* Mobile CTAs stay visible where the artwork hit areas are hidden. */}
      <div className="relative z-20 mt-auto w-full px-4 pb-3 md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onShopCollection}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <span>{t('hero.shop')}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenFitStudio}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#0B0E16]/85 px-3 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            <span>{t('hero.fit')}</span>
            <Shirt className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <a
        href="#shop"
        className="absolute bottom-6 right-6 z-20 hidden items-center gap-2 text-xs font-medium text-white/80 transition-colors hover:text-white md:inline-flex lg:bottom-8 lg:right-10"
      >
        <ArrowDown className="h-4 w-4 text-rose-500" aria-hidden="true" />
        <span>{t('hero.scroll')}</span>
      </a>
      </section>

      <div
        role="region"
        aria-label={t('story.kicker')}
        className="w-full overflow-hidden border-y border-white/[0.08] bg-[#080A10] py-3.5"
      >
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              role={copy === 0 ? 'list' : undefined}
              className="flex shrink-0 items-center gap-7 pr-7 sm:gap-10 sm:pr-10"
            >
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.title}>
                    <div
                      role={copy === 0 ? 'listitem' : undefined}
                      className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-100 sm:text-xs"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                      <span>
                        {t(item.title)} <span className="text-zinc-500">—</span> {t(item.subtitle)}
                      </span>
                    </div>
                    <span className="text-rose-600/80" aria-hidden="true">/</span>
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

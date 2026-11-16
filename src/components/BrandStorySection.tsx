import React from 'react';
import { Shirt, ArrowRight } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

interface BrandStorySectionProps {
  onOpenFitStudio: () => void;
}

const PILLARS = [
  {
    index: '01.',
    title: 'story.movement',
    description: 'story.movementText',
  },
  {
    index: '02.',
    title: 'story.fleece',
    description: 'story.fleeceText',
  },
  {
    index: '03.',
    title: 'story.delivery',
    description: 'story.deliveryText',
  },
];

export const BrandStorySection: React.FC<BrandStorySectionProps> = ({
  onOpenFitStudio,
}) => {
  const { t } = useLocale();
  return (
    <section
      id="about"
      className="py-16 sm:py-24 bg-[#080A10] border-t border-white/[0.06]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-rose-500 mb-2">
              {t('story.kicker')}
            </p>
            <h2
              className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {t('story.title')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenFitStudio}
            className="inline-flex items-center gap-2.5 px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 rounded-xl transition-colors self-start lg:self-auto whitespace-nowrap shrink-0"
          >
            <Shirt className="w-4 h-4 text-rose-500" aria-hidden="true" />
            <span>{t('story.fit')}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.index}
              className="p-6 sm:p-8 rounded-2xl bg-[#0B0E16] border border-white/[0.07]"
            >
              <span className="font-mono-tabular text-xs font-semibold text-rose-500 block mb-3">
                {pillar.index}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2.5">
                {t(pillar.title)}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t(pillar.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

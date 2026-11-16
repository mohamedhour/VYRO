import { Check } from 'lucide-react'
import { useLocale } from '@/context/LocaleContext'

export default function SelectCard({ product, selected, onSelect }) {
  const { t } = useLocale()
  return (
    <div className="flex w-36 shrink-0 flex-col gap-2 sm:w-40">
      <div className="relative aspect-[3/4] overflow-hidden border border-vyro-line bg-vyro-panel">
        <img src={product.imageUrl || product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <p className="truncate text-sm text-vyro-white">{product.name}</p>
      <p className="text-sm text-vyro-mute">{product.price || `MAD ${Number(product.priceMad || product.priceValue || 0).toLocaleString('en-US')}`}</p>
      <button
        onClick={() => onSelect(product)}
        aria-pressed={selected}
        className={`flex items-center justify-center gap-1.5 border py-2 text-xs font-medium transition-colors ${
          selected
            ? 'border-vyro-accent bg-vyro-accent text-vyro-black'
            : 'border-vyro-line text-vyro-white hover:border-vyro-mute'
        }`}
      >
        {selected && <Check size={13} strokeWidth={2} />}
        {selected ? t('slot.selected') : t('slot.select')}
      </button>
    </div>
  )
}

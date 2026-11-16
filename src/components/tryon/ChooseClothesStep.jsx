import { useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import SelectCard from '@/components/outfit/SelectCard'
import { SLOTS, productsForSlot } from '@/lib/tryonSlots'
import { useLocale } from '@/context/LocaleContext'

export default function ChooseClothesStep({ selections, onSelect, onContinue, onBack, focusSlot, products }) {
  const { t } = useLocale()
  const rowRefs = useRef({})
  const hasSelection = Object.values(selections).some(Boolean)

  useEffect(() => {
    if (focusSlot && rowRefs.current[focusSlot]) {
      rowRefs.current[focusSlot].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [focusSlot])

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="font-display text-2xl font-semibold uppercase text-vyro-white sm:text-3xl">
          {t('choose.title')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-vyro-mute">
          {t('choose.help')}
        </p>
      </div>

      {SLOTS.map((slot) => {
        const slotProducts = productsForSlot(slot.key, products)
        const selected = selections[slot.key]
        return (
          <div
            key={slot.key}
            ref={(el) => (rowRefs.current[slot.key] = el)}
            className={`flex flex-col gap-4 border-t border-vyro-line pt-6 transition-colors ${
              focusSlot === slot.key ? 'border-vyro-accent' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold uppercase tracking-wide text-vyro-white">
                {t(`slot.${slot.key}`)}
              </span>
              {selected && (
                <span className="text-xs text-vyro-accent">{selected.name} {t('choose.selected')}</span>
              )}
            </div>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
              {slotProducts.map((product) => (
                <SelectCard
                  key={product.id}
                  product={product}
                  selected={selected?.id === product.id}
                  onSelect={(p) => onSelect(slot.key, selected?.id === p.id ? null : p)}
                />
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between border-t border-vyro-line pt-6">
        <Button variant="outline" size="lg" onClick={onBack}>
          {t('choose.back')}
        </Button>
        <div className="flex flex-col items-end gap-2">
          {!hasSelection && (
            <p className="text-xs text-vyro-mute">{t('choose.empty')}</p>
          )}
          <Button variant="primary" size="lg" disabled={!hasSelection} onClick={onContinue}>
            {t('choose.continue')}
          </Button>
        </div>
      </div>
    </div>
  )
}

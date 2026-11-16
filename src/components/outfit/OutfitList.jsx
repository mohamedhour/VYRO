import { Plus, X, RefreshCw } from 'lucide-react'
import { SLOTS } from '@/lib/tryonSlots'
import { useLocale } from '@/context/LocaleContext'

/**
 * @param {Object} selections - slotKey -> product | undefined
 * @param {(slotKey:string) => void} onRemove
 * @param {(slotKey:string) => void} onReplace - also used for "Add" on empty slots
 * @param {boolean} [showTotal=true]
 * @param {boolean} [showAddButtons=true]
 * @param {string} [emptyMessage]
 */
export default function OutfitList({
  selections,
  onRemove,
  onReplace,
  showTotal = true,
  showAddButtons = true,
  emptyMessage = 'Nothing selected yet.',
}) {
  const { t } = useLocale()
  const filled = SLOTS.filter((slot) => selections[slot.key])
  const empty = SLOTS.filter((slot) => !selections[slot.key])
  const total = filled.reduce((sum, slot) => sum + Number(selections[slot.key].priceValue ?? selections[slot.key].priceMad ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      {filled.length === 0 ? (
        <p className="text-sm text-vyro-mute">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col border-t border-vyro-line">
          {filled.map((slot, i) => {
            const product = selections[slot.key]
            return (
              <div key={slot.key}>
                {i > 0 && (
                  <div className="flex justify-center py-1.5 text-vyro-mute">
                    <span className="font-display text-base">+</span>
                  </div>
                )}
                <div className="flex items-center gap-3 border-b border-vyro-line py-3.5">
                  <div className="h-16 w-12 shrink-0 overflow-hidden bg-vyro-panel">
                    <img src={product.imageUrl || product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-vyro-mute">{t(`slot.${slot.key}`)}</span>
                    <p className="truncate font-body text-sm text-vyro-white">{product.name}</p>
                    <p className="text-sm text-vyro-mute">{product.price || `MAD ${Number(product.priceMad || product.priceValue || 0).toLocaleString('en-US')}`}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => onReplace(slot.key)}
                      aria-label={`${t('slot.replace')} ${t(`slot.${slot.key}`)}`}
                      className="flex h-8 w-8 items-center justify-center border border-vyro-line text-vyro-white transition-colors hover:border-vyro-accent hover:text-vyro-accent"
                    >
                      <RefreshCw size={13} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => onRemove(slot.key)}
                      aria-label={`${t('cart.remove')} ${t(`slot.${slot.key}`)}`}
                      className="flex h-8 w-8 items-center justify-center border border-vyro-line text-vyro-white transition-colors hover:border-red-400 hover:text-red-400"
                    >
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {showTotal && (
            <div className="flex items-center justify-between py-3.5">
              <span className="text-sm text-vyro-mute">{t('slot.outfitTotal')}</span>
              <span className="font-body text-base text-vyro-white">
                MAD {total.toLocaleString('en-US')}
              </span>
            </div>
          )}
        </div>
      )}

      {showAddButtons && empty.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {empty.map((slot) => (
            <button
              key={slot.key}
              onClick={() => onReplace(slot.key)}
              className="flex items-center gap-1.5 border border-dashed border-vyro-line px-3.5 py-2 text-xs text-vyro-mute transition-colors hover:border-vyro-accent hover:text-vyro-accent"
            >
              <Plus size={12} strokeWidth={1.5} />
              {t('slot.add')} {t(`slot.${slot.key}`).toLowerCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

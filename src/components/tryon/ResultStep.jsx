import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TriangleAlert, RotateCcw, Heart, ShoppingBag } from 'lucide-react'
import { Spinner } from '@/components/ui/Loader'
import Button from '@/components/ui/Button'
import ResultPreviewFrame from './ResultPreviewFrame'
import { SLOTS } from '@/lib/tryonSlots'
import { generateTryOnPreview } from '@/lib/tryOnService'
import { logTryOnEvent } from '@/lib/adminApi'
import { useLocale } from '@/context/LocaleContext'

/**
 * Mounted fresh (via a `key` on the parent) each time a generation run
 * starts, so its own state always begins clean — no reset-on-prop-change
 * effect needed.
 */
export default function ResultStep({ photo, selections, onRetry, onTryAnotherLook, onSaveLook, onAddToCart, onBackToBuild }) {
  const { t } = useLocale()
  const [status, setStatus] = useState('loading')
  const [stageIndex, setStageIndex] = useState(0)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await generateTryOnPreview({
          photo: photo?.dataUrl,
          selections,
          onProgress: (i) => {
            if (!cancelled) setStageIndex(i)
          },
        })
        if (!cancelled) {
          setResult(res)
          setStatus('success')
          logTryOnEvent(Object.values(selections).filter(Boolean).map((p) => p.id))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong generating your preview.')
          setStatus('error')
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [photo, selections])

  const items = SLOTS.map((slot) => selections[slot.key]).filter(Boolean)
  const total = items.reduce((sum, item) => sum + Number(item.priceValue ?? item.priceMad ?? 0), 0)

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
          <h2 className="font-display text-2xl font-semibold uppercase text-vyro-white sm:text-3xl">
          {t('result.loading')}
        </h2>
        <Spinner size={32} className="text-vyro-accent" />
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-vyro-mute"
          >
            {t(`result.stage${stageIndex + 1}`)}
          </motion.p>
        </AnimatePresence>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <TriangleAlert size={28} strokeWidth={1.5} className="text-red-400" />
        <h2 className="font-display text-xl font-semibold text-vyro-white">
          {t('result.error')}
        </h2>
        <p className="max-w-sm text-sm text-vyro-mute">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={onBackToBuild}>
          {t('result.back')}
          </Button>
          <Button variant="primary" size="md" onClick={onRetry}>
            <RotateCcw size={14} strokeWidth={1.5} />
            {t('result.retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold uppercase text-vyro-white sm:text-3xl">
          {t('result.title')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-vyro-mute">
          {t('result.help')}
        </p>
      </div>

      <ResultPreviewFrame photoDataUrl={result.photo} items={result.items} />

      <div className="flex flex-col gap-3 border-t border-vyro-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-6 text-sm">
              <span className="text-vyro-white">{item.name}</span>
              <span className="text-vyro-mute">{item.price || `MAD ${Number(item.priceMad || item.priceValue || 0).toLocaleString('en-US')}`}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-vyro-mute">{t('result.total')}</span>
          <span className="font-body text-base text-vyro-white">
            MAD {total.toLocaleString('en-US')}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" size="lg" className="flex-1" onClick={onTryAnotherLook}>
          {t('result.another')}
        </Button>
        <Button variant="outline" size="lg" className="flex-1" onClick={() => { onSaveLook(); setSaved(true) }}>
          <Heart size={15} strokeWidth={1.5} />
          {saved ? t('result.saved') : t('result.save')}
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={() => onAddToCart(items, total)}>
          <ShoppingBag size={15} strokeWidth={1.5} />
          {t('result.add')}
        </Button>
      </div>
    </motion.div>
  )
}

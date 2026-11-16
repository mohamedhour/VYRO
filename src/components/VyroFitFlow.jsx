import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import StepIndicator from '@/components/ui/StepIndicator'
import PhotoUploadStep from '@/components/tryon/PhotoUploadStep'
import ChooseClothesStep from '@/components/tryon/ChooseClothesStep'
import BuildLookStep from '@/components/tryon/BuildLookStep'
import ResultStep from '@/components/tryon/ResultStep'
import { useLocale } from '@/context/LocaleContext'

export default function VyroFitFlow({ products, onClose, onAddLookToCart }) {
  const { t } = useLocale()
  const tryOnSteps = [
    { number: 1, label: t('fit.photo') },
    { number: 2, label: t('fit.choose') },
    { number: 3, label: t('fit.build') },
    { number: 4, label: t('fit.virtual') },
  ]
  const closeRef = useRef(onClose)
  const [step, setStep] = useState(1)
  const [maxUnlocked, setMaxUnlocked] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [selections, setSelections] = useState({})
  const [focusSlot, setFocusSlot] = useState(null)
  const [runId, setRunId] = useState(0)

  closeRef.current = onClose

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const goTo = (nextStep) => {
    if (nextStep <= maxUnlocked) {
      setStep(nextStep)
      setFocusSlot(null)
    }
  }

  const advanceTo = (nextStep) => {
    setStep(nextStep)
    setMaxUnlocked((current) => Math.max(current, nextStep))
  }

  const handleSelect = (slotKey, product) => {
    setSelections((current) => ({ ...current, [slotKey]: product }))
  }

  const handleRemove = (slotKey) => {
    setSelections((current) => {
      const next = { ...current }
      delete next[slotKey]
      return next
    })
  }

  const handleReplace = (slotKey) => {
    setFocusSlot(slotKey)
    advanceTo(2)
  }

  const handleGenerate = () => {
    setRunId((current) => current + 1)
    advanceTo(4)
  }

  const handleTryAnotherLook = () => {
    setSelections({})
    setFocusSlot(null)
    advanceTo(2)
  }

  const handleSaveLook = () => {
    try {
      const key = 'vyro-saved-looks'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const look = {
        id: `look-${Date.now()}`,
        createdAt: Date.now(),
        productIds: Object.values(selections).filter(Boolean).map((product) => String(product.id)),
        photoDataUrl: photo?.dataUrl ?? null,
      }
      localStorage.setItem(key, JSON.stringify([look, ...(Array.isArray(existing) ? existing : [])]))
    } catch {
      // Storage can be unavailable; the try-on flow remains usable.
    }
  }

  const handleAddToCart = (items) => {
    onAddLookToCart(items.map((product) => ({
      product,
      size: product.sizes?.[0] || 'One Size',
    })))
    onClose()
  }

  return (
    <div
      className="vyro-fit-flow fixed inset-0 z-[80] overflow-y-auto bg-black/80 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label={t('fit.title')}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative mx-auto min-h-full w-full max-w-5xl border border-white/10 bg-[#06070B] px-4 pb-8 pt-6 shadow-2xl sm:min-h-0 sm:rounded-2xl sm:px-8 sm:pb-10 sm:pt-8 lg:px-12">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('fit.close')}
          className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 sm:right-6 sm:top-6"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mb-8 flex flex-col gap-6 pr-12 sm:mb-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">VYRO Fit</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{t('fit.title')}</h1>
          </div>
          <StepIndicator steps={tryOnSteps} step={step} maxUnlocked={maxUnlocked} onStepClick={goTo} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <PhotoUploadStep
                photo={photo}
                onUpload={setPhoto}
                onRemove={() => setPhoto(null)}
                onContinue={() => advanceTo(2)}
              />
            )}
            {step === 2 && (
              <ChooseClothesStep
                products={products}
                selections={selections}
                onSelect={handleSelect}
                onContinue={() => advanceTo(3)}
                onBack={() => goTo(1)}
                focusSlot={focusSlot}
              />
            )}
            {step === 3 && (
              <BuildLookStep
                selections={selections}
                onRemove={handleRemove}
                onReplace={handleReplace}
                onContinue={handleGenerate}
                onBack={() => goTo(2)}
              />
            )}
            {step === 4 && (
              <ResultStep
                key={runId}
                photo={photo}
                selections={selections}
                onRetry={() => setRunId((current) => current + 1)}
                onTryAnotherLook={handleTryAnotherLook}
                onSaveLook={handleSaveLook}
                onAddToCart={handleAddToCart}
                onBackToBuild={() => goTo(3)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

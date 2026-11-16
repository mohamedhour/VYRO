import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, RefreshCw, ImageOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useLocale } from '@/context/LocaleContext'

const MAX_SIZE_MB = 8

export default function PhotoUploadStep({ photo, onUpload, onRemove, onContinue }) {
  const { t } = useLocale()
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('photo.errorType'))
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t('photo.errorSize').replace('{size}', String(MAX_SIZE_MB)))
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => onUpload({ dataUrl: reader.result, name: file.name })
    reader.onerror = () => setError(t('photo.errorRead'))
    reader.readAsDataURL(file)
  }

  const onInputChange = (e) => handleFile(e.target.files?.[0])

  const onDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold uppercase text-vyro-white sm:text-3xl">
          {t('photo.title')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-vyro-mute">
          {t('photo.help')}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {!photo ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-4 border border-dashed px-6 py-16 text-center transition-colors sm:py-24 ${
            dragActive ? 'border-vyro-accent bg-vyro-panel' : 'border-vyro-line bg-vyro-panel'
          }`}
        >
          <Upload size={28} strokeWidth={1.2} className="text-vyro-mute" />
          <div>
            <Button variant="primary" size="md" onClick={() => inputRef.current?.click()}>
              {t('photo.title')}
            </Button>
            <p className="mt-3 text-xs text-vyro-mute">{t('photo.drag')}</p>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-start gap-4 sm:flex-row"
        >
          <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden border border-vyro-line bg-vyro-panel">
            <img src={photo.dataUrl} alt={t('photo.title')} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-vyro-white">{photo.name || t('fit.photo')}</p>
            <p className="text-xs text-vyro-mute">{t('photo.looksGood')}</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                <RefreshCw size={13} strokeWidth={1.5} />
                {t('photo.replace')}
              </Button>
              <Button variant="outline" size="sm" onClick={onRemove}>
                <X size={13} strokeWidth={1.5} />
                {t('photo.remove')}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <ImageOff size={14} strokeWidth={1.5} />
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-vyro-line pt-6">
        <Button variant="primary" size="lg" disabled={!photo} onClick={onContinue}>
          {t('photo.continue')}
        </Button>
      </div>
    </div>
  )
}

import Button from '@/components/ui/Button'
import OutfitList from '@/components/outfit/OutfitList'
import { filledSlots } from '@/lib/tryonSlots'
import { useLocale } from '@/context/LocaleContext'

export default function BuildLookStep({ selections, onRemove, onReplace, onContinue, onBack }) {
  const { t } = useLocale()
  const hasAnyItem = filledSlots(selections).length > 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl font-semibold uppercase text-vyro-white sm:text-3xl">
          {t('build.title')}
        </h2>
        <p className="mt-2 max-w-md text-sm text-vyro-mute">
          {t('build.help')}
        </p>
      </div>

      <OutfitList
        selections={selections}
        onRemove={onRemove}
        onReplace={onReplace}
        emptyMessage={t('build.empty')}
      />

      <div className="flex items-center justify-between border-t border-vyro-line pt-6">
        <Button variant="outline" size="lg" onClick={onBack}>
          {t('choose.back')}
        </Button>
        <Button variant="accent" size="lg" disabled={!hasAnyItem} onClick={onContinue}>
          {t('build.generate')}
        </Button>
      </div>
    </div>
  )
}

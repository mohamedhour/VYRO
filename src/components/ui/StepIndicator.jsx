import { Check } from 'lucide-react'

/**
 * @param {{number:number,label:string}[]} steps
 * @param {number} step - current step number
 * @param {number} maxUnlocked - furthest step reached so far; steps
 *   beyond this aren't clickable yet
 * @param {(step:number) => void} onStepClick
 */
export default function StepIndicator({ steps, step, maxUnlocked, onStepClick }) {
  return (
    <ol className="flex items-stretch gap-2 sm:gap-4">
      {steps.map((s) => {
        const isActive = s.number === step
        const isComplete = s.number < step
        const isUnlocked = s.number <= maxUnlocked
        return (
          <li key={s.number} className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onStepClick(s.number)}
              className={`h-[2px] w-full transition-colors ${
                isComplete || isActive ? 'bg-vyro-accent' : 'bg-vyro-line'
              } ${isUnlocked ? 'cursor-pointer' : 'cursor-default'}`}
              aria-label={`Go to step ${s.number}: ${s.label}`}
            />
            <div className="flex items-center gap-1.5">
              <span
                className={`font-display text-xs ${
                  isActive ? 'text-vyro-accent' : isComplete ? 'text-vyro-white' : 'text-vyro-mute'
                }`}
              >
                {String(s.number).padStart(2, '0')}
              </span>
              {isComplete && <Check size={11} strokeWidth={2} className="text-vyro-accent" />}
              <span
                className={`hidden text-xs sm:inline ${
                  isActive ? 'text-vyro-white' : 'text-vyro-mute'
                }`}
              >
                {s.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

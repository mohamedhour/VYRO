/**
 * Small spinner for inline/button loading states.
 */
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />
      <path
        d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Flat skeleton block for content placeholders (product grids, images).
 * No shimmer gradient sweep — a quiet pulse instead, in keeping with the
 * "no excessive gradients" rule.
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-vyro-panel border border-vyro-line ${className}`} />
  )
}

/**
 * Skeleton sized to match ProductCard, for grid loading states.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[3/4] w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

/**
 * Full-viewport loading state, e.g. while a route or the try-on render
 * is preparing.
 */
export function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-vyro-mute">
      <Spinner size={28} />
      <p className="font-body text-sm tracking-wide">{label}</p>
    </div>
  )
}

import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

const VARIANTS = {
  primary:
    'bg-[#d9142a] text-white shadow-[0_8px_26px_rgba(217,20,42,0.2)] hover:bg-[#b70f22]',
  outline:
    'bg-transparent text-vyro-white border border-vyro-line hover:border-vyro-white hover:bg-vyro-panel',
  ghost:
    'bg-transparent text-vyro-white hover:text-vyro-accent px-0',
  accent:
    'bg-vyro-accent text-vyro-black hover:bg-white',
}

const SIZES = {
  sm: 'text-sm px-4 py-2',
  md: 'text-sm px-6 py-3.5',
  lg: 'text-base px-8 py-4',
}

/**
 * Shared button used across VYRO. Renders a <button>, or a router <Link>
 * when `to` is supplied, or a plain <a> when `href` is supplied — the
 * visual treatment stays identical no matter which element is under it.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    to,
    href,
    className = '',
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 font-body font-medium tracking-normal transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap'
  const classes = `${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${
    variant !== 'ghost' ? SIZES[size] ?? SIZES.md : ''
  } ${className}`

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})

export default Button

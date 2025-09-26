import type { ReactNode } from 'react'

interface SurfaceCardProps {
  title?: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  padding?: 'default' | 'snug' | 'none'
  hover?: boolean
  id?: string
}

const paddingClasses: Record<NonNullable<SurfaceCardProps['padding']>, string> = {
  default: 'px-6 py-6',
  snug: 'px-5 py-5',
  none: 'p-0',
}

export default function SurfaceCard({
  title,
  subtitle,
  eyebrow,
  actions,
  footer,
  children,
  className = '',
  padding = 'default',
  hover = true,
  id,
}: SurfaceCardProps) {
  const paddingClass = paddingClasses[padding]
  const hoverClass = hover ? 'surface-card--interactive hover:-translate-y-[2px]' : ''

  const cardClassName = [
    'surface-card relative flex flex-col gap-5 transition-transform duration-200 ease-out',
    paddingClass,
    hoverClass,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section id={id} className={cardClassName}>
      {(title || subtitle || eyebrow || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow && (
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[var(--muted-foreground)]/70">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="text-lg font-semibold leading-tight text-[var(--foreground)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-start gap-2 text-sm">{actions}</div>}
        </header>
      )}

      <div className="relative flex-1">{children}</div>

      {footer && (
        <footer className="pt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {footer}
        </footer>
      )}
    </section>
  )}

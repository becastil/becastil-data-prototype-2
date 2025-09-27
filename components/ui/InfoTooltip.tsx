'use client'

import { CircleHelp } from 'lucide-react'
import { ReactNode, useEffect, useId, useRef, useState } from 'react'

interface InfoTooltipSection {
  title?: string
  content: ReactNode
}

interface InfoTooltipProps {
  /**
   * Heading + body content segments to render inside the tooltip.
   * Each section renders in order to keep structured guidance concise.
   */
  sections: InfoTooltipSection[]
  /** Accessible label announced to assistive tech. */
  label?: string
  /** Optional class name applied to the trigger button. */
  triggerClassName?: string
  /** Optional class name applied to the tooltip surface. */
  contentClassName?: string
}

export default function InfoTooltip({
  sections,
  label = 'View additional information',
  triggerClassName,
  contentClassName,
}: InfoTooltipProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const clearPendingClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const show = () => {
    clearPendingClose()
    setOpen(true)
  }

  const hide = () => {
    clearPendingClose()
    setOpen(false)
  }

  const hideWithDelay = () => {
    clearPendingClose()
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false)
      closeTimeoutRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      clearPendingClose()
    }
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      hide()
      buttonRef.current?.blur()
    }
  }

  const handleClick = () => {
    if (open) {
      hide()
    } else {
      show()
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hideWithDelay}
        onFocus={show}
        onBlur={hideWithDelay}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 hover:border-black/30 hover:bg-black/5 ${
          triggerClassName ?? ''
        }`}
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!open}
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-black/10 bg-white p-4 text-sm text-black shadow-lg transition-all duration-150 ease-out ${
          open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
        } ${contentClassName ?? ''}`}
      >
        <span className="pointer-events-none absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-black/10 border-b-0 border-r-0 bg-white" />
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index} className="space-y-1">
              {section.title ? (
                <div className="font-semibold text-black">{section.title}</div>
              ) : null}
              <div className="text-[13px] leading-relaxed text-black/80">{section.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

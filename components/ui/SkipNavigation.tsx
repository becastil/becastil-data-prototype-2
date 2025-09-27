'use client'

export default function SkipNavigation() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="
          absolute top-4 left-4 z-50 px-4 py-2 
          bg-[var(--accent)] text-white rounded-md
          font-medium text-sm
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--accent)]
          transform -translate-y-full focus:translate-y-0
          transition-transform duration-200
        "
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="
          absolute top-4 left-32 z-50 px-4 py-2 
          bg-[var(--accent)] text-white rounded-md
          font-medium text-sm
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--accent)]
          transform -translate-y-full focus:translate-y-0
          transition-transform duration-200
        "
      >
        Skip to navigation
      </a>
    </div>
  )
}
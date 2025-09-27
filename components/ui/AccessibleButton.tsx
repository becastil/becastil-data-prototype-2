'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    className = '',
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-haspopup': ariaHasPopup,
    ...props
  }, ref) => {
    const baseClasses = 'btn-premium focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:outline-none'
    
    const variantClasses = {
      primary: 'btn-premium--primary',
      secondary: 'btn-premium--secondary',
      ghost: 'btn-premium--ghost'
    }

    const sizeClasses = {
      sm: 'text-sm px-3 py-2',
      md: 'text-sm px-4 py-3',
      lg: 'text-base px-6 py-4'
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses} 
          ${variantClasses[variant]} 
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${className}
        `}
        disabled={isDisabled}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        aria-busy={loading}
        {...props}
      >
        <span className="flex items-center justify-center gap-2">
          {loading && (
            <span 
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <span aria-hidden="true">{icon}</span>
          )}
          
          <span>
            {loading ? loadingText : children}
          </span>
          
          {!loading && icon && iconPosition === 'right' && (
            <span aria-hidden="true">{icon}</span>
          )}
        </span>
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton
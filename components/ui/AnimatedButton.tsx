'use client'

import { motion } from 'framer-motion'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const baseClasses = 'btn-premium'
  
  const variantClasses = {
    primary: 'btn-premium--primary',
    secondary: 'btn-premium--secondary',
    ghost: 'btn-premium--ghost'
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      disabled={isDisabled}
      whileHover={!isDisabled ? {
        scale: 1.02,
        y: -1,
        transition: { duration: 0.15, ease: "easeOut" }
      } : {}}
      whileTap={!isDisabled ? {
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
      {...props}
    >
      <motion.span
        className="flex items-center gap-2"
        animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
      >
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        {children}
      </motion.span>
    </motion.button>
  )
}
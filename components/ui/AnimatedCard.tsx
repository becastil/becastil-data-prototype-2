'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  variant?: 'fade' | 'slideUp' | 'slideIn' | 'scale' | 'bounce'
  whileHover?: boolean
  whileTap?: boolean
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
  duration = 0.2,
  variant = 'fade',
  whileHover = true,
  whileTap = false
}: AnimatedCardProps) {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    },
    bounce: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 200,
          damping: 10
        }
      },
      exit: { opacity: 0, scale: 0.8 }
    }
  }

  const hoverAnimation = whileHover ? {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.15, ease: "easeOut" }
  } : {}

  const tapAnimation = whileTap ? {
    scale: 0.98,
    transition: { duration: 0.1 }
  } : {}

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
    >
      {children}
    </motion.div>
  )
}
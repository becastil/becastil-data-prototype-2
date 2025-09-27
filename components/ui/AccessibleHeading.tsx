'use client'

import { createElement, ReactNode } from 'react'

interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  className?: string
  id?: string
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export default function AccessibleHeading({
  level,
  children,
  className = '',
  id,
  visualLevel
}: AccessibleHeadingProps) {
  // Use visual level for styling, semantic level for HTML structure
  const displayLevel = visualLevel || level
  
  const levelStyles = {
    1: 'text-4xl font-bold text-black',
    2: 'text-3xl font-bold text-black',
    3: 'text-2xl font-semibold text-black',
    4: 'text-xl font-semibold text-black',
    5: 'text-lg font-medium text-black',
    6: 'text-base font-medium text-black'
  }

  return createElement(
    `h${level}`,
    {
      className: `${levelStyles[displayLevel]} ${className}`,
      id
    },
    children
  )
}
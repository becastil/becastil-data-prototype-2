'use client'

import type { User } from '@supabase/supabase-js'
import NavigationClient from './NavigationClient'

interface NavigationProps {
  user: User | null
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: (open: boolean) => void
}

export default function Navigation(props: NavigationProps) {
  return <NavigationClient {...props} />
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardIndex() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the first step
    router.replace('/dashboard/upload')
  }, [router])
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-black">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

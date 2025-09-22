'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
}

export default function ProfileSetup({ user }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
    organizationSlug: '',
    role: 'admin' as 'admin' | 'user' | 'readonly'
  })
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create organization first
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.organizationName,
          slug: formData.organizationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        })
        .select()
        .single()

      if (orgError) {
        throw orgError
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          organization_id: org.id,
          email: user.email!,
          full_name: formData.fullName,
          role: formData.role
        })

      if (profileError) {
        throw profileError
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred during setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Complete Your Profile
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                fullName: e.target.value
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.organizationName}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                organizationName: e.target.value,
                organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization ID (URL-friendly)
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.organizationSlug}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                organizationSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                role: e.target.value as 'admin' | 'user' | 'readonly'
              }))}
            >
              <option value="admin">Administrator</option>
              <option value="user">User</option>
              <option value="readonly">Read Only</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
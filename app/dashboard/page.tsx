import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ProfileSetup from '@/components/ProfileSetup'
import DashboardStats from '@/components/DashboardStats'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: { full_name?: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = data

    if (!profile) {
      return <ProfileSetup user={user} />
    }
  }

  const displayName = profile?.full_name ?? user?.email ?? 'Guest Analyst'
  const showGuestBanner = !user

  return (
    <div className="relative min-h-screen bg-gray-50 pb-16 dark:bg-gray-900">
      {showGuestBanner && (
        <div className="pointer-events-none fixed right-6 top-28 hidden sm:block">
          <div className="flex items-center gap-2 rounded-full border border-amber-400 bg-amber-100/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-700 shadow-lg dark:border-amber-500 dark:bg-amber-900/70 dark:text-amber-200">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75M12 15.75h.008v.008H12zM2.25 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25 2.25 6.615 2.25 12z" />
            </svg>
            Demo Mode
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl">
            Healthcare Analytics
            <span className="text-blue-600"> Dashboard</span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            {user ? (
              <>Welcome back, {displayName}</>
            ) : (
              'Explore our interactive analytics experience using curated sample data.'
            )}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload CSV
          </Link>
          <Link
            href="/charts/test"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            View Charts
          </Link>
          <Link
            href="/insights/data-dashboards-for-business-success"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-6 py-2 text-sm font-semibold text-blue-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            View Research Summary
          </Link>
        </div>

        {showGuestBanner && (
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-6 shadow-lg shadow-blue-900/10 dark:border-blue-900 dark:bg-blue-950/40 dark:shadow-none sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-base font-semibold text-blue-900 dark:text-blue-100">Demo data in use</p>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                    You&apos;re exploring sample insights. Sign in to connect your Supabase workspace and bring in your organization&apos;s live claims data.
                  </p>
                </div>
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Sign In to Connect Your Data
              </Link>
            </div>
          </div>
        )}

        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Action Cards */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Upload & Process Data */}
          <Link href="/upload" className="group">
            <div className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-sm transition-transform duration-150 group-hover:-translate-y-1 group-hover:shadow-xl dark:border-blue-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
              <div className="p-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors group-hover:bg-blue-700">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Data Processing
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Upload & Process CSV
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Upload healthcare claims CSV files with automatic format detection for Anthem, ESI, UHC, Aetna, and Cigna.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m4.5 2.25a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
                    </svg>
                    HIPAA-ready import pipeline
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Analysis & Reporting */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 opacity-75">
            <div className="p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Analytics & Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced analytics, stop-loss calculations, and financial reporting capabilities.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 opacity-75">
            <div className="p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Configuration
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure field mappings, validation rules, and custom carrier formats.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Summary */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Smart Format Detection
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically detects and processes CSV files from major insurance carriers including Anthem, ESI, UnitedHealthcare, Aetna, and Cigna with 99%+ accuracy.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                High-Performance Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Streaming data processing capable of handling large files up to 100MB with real-time progress tracking and error reporting.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Advanced Validation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive data validation with error detection, data quality scoring, duplicate detection, and automated normalization.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Interactive Review
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Virtualized data tables for reviewing large datasets, error correction, field mapping adjustments, and flexible export options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

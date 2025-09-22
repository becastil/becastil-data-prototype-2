import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sorry, we couldn't log you in. The link may have expired or been used already.
          </p>
        </div>
        <div className="text-center">
          <Link 
            href="/auth/login"
            className="text-blue-600 hover:text-blue-500"
          >
            Try logging in again
          </Link>
        </div>
      </div>
    </div>
  )
}
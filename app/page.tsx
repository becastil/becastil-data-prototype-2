import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light text-gray-900 mb-12">
          Healthcare Analytics
        </h1>
        
        <Link
          href="/reports"
          className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
        >
          View Report
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Healthcare Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your healthcare cost data into actionable insights. 
            Upload your CSV files and generate comprehensive analytics reports instantly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/upload"
            className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-all hover:shadow-xl"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Your CSV Data
          </Link>
          
          <div className="text-gray-400 text-lg font-medium">or</div>
          
          <Link
            href="/reports"
            className="inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg shadow-lg hover:border-gray-400 hover:shadow-xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5-1.5m-.5 1.5l-.5-1.5m.002-3H6.248m14.015 0l-3.76-14.967A.75.75 0 0015.747 1H8.253a.75.75 0 00-.742.633L3.751 16.6m14.015 0a.75.75 0 01-.742.633H6.976a.75.75 0 01-.742-.633" />
            </svg>
            View Sample Report
          </Link>
        </div>

        {/* Features section */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Can Analyze</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Healthcare Costs</h3>
              </div>
              <p className="text-gray-600">
                Monthly cost breakdowns by category including medical claims, pharmacy costs, and stop loss recoveries.
              </p>
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">High Cost Claimants</h3>
              </div>
              <p className="text-gray-600">
                Individual member analysis with demographics, risk scores, and monthly spending patterns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

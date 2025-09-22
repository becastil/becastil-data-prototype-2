import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">HealthDash Analytics</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powering HIPAA-compliant healthcare insights.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">© {year} HealthDash Analytics. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
          <Link href="/privacy" className="transition hover:text-blue-600">Privacy Policy</Link>
          <Link href="/terms" className="transition hover:text-blue-600">Terms of Service</Link>
          <Link href="/security" className="transition hover:text-blue-600">Security &amp; HIPAA</Link>
          <a href="mailto:contact@healthdash.co" className="transition hover:text-blue-600">Contact</a>
        </div>
      </div>
    </footer>
  )
}

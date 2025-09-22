export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Terms of Service</h1>
      <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Updated May 2025</p>
      <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
        This placeholder agreement defines acceptable use of the Healthcare Analytics Dashboard
        platform. Replace with your organization&apos;s legal terms prior to onboarding customers.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Platform Access</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Explain account responsibilities, credential security expectations, and permitted use cases for
          healthcare analytics data.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Service Commitments</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Outline uptime targets, maintenance windows, and support response times. Clarify limitations of
          liability and indemnification terms.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Termination</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Describe account termination conditions, data retention timelines, and procedures for returning
          or deleting protected health information.
        </p>
      </section>
    </div>
  )
}

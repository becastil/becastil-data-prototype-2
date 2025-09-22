export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Security &amp; HIPAA Compliance</h1>
      <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Updated May 2025</p>
      <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
        Use this placeholder to communicate your organization&apos;s safeguards for protected health
        information (PHI). Replace with validated compliance language before production launch.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Administrative Safeguards</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-slate-600 dark:text-slate-300">
          <li>Documented HIPAA policies, workforce training, and access reviews.</li>
          <li>Incident response procedures with designated privacy officer.</li>
          <li>Vendor risk management for all downstream processors.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Technical Safeguards</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-slate-600 dark:text-slate-300">
          <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256).</li>
          <li>Least-privilege access with audit logging and anomaly detection.</li>
          <li>Network isolation with breach detection and disaster recovery testing.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          For security inquiries or Business Associate Agreements (BAAs), contact your compliance team at
          <a href="mailto:security@example.com" className="ml-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">security@example.com</a>.
        </p>
      </section>
    </div>
  )
}

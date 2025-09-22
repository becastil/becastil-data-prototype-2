export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
      <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Updated May 2025</p>
      <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
        This placeholder policy outlines how Healthcare Analytics Dashboard collects, uses, and protects
        information. Replace this copy with your organization&apos;s official privacy statement prior to
        production launch.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Data Collection</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Describe personal information collected, the purpose of collection, and how users can manage
          their preferences. Include details about analytics, cookies, and third-party integrations.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Use of Information</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Summarize how data supports the platform experience, including reporting, security, and
          support operations. Clarify safeguards used to protect healthcare information.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Your Rights</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Outline user rights for accessing, updating, or deleting personal data. Provide a contact
          address for privacy inquiries and HIPAA requests.
        </p>
      </section>
    </div>
  )
}

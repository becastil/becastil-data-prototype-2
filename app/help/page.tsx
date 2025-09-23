import Link from 'next/link'

export const metadata = {
  title: 'Help Center | Healthcare Analytics Dashboard',
  description: 'Guides, tutorials, and resources for the healthcare analytics dashboard.',
}

const quickStartItems = [
  {
    title: 'Upload guided tour',
    description: 'Follow the three-stage upload, validation, and review workflow with sample data.',
    href: '/upload',
  },
  {
    title: 'Sample datasets',
    description: 'Experiment with curated healthcare claims data to explore dashboard features.',
    href: '/sample-data/healthcare_cost_dummy_data.csv',
  },
  {
    title: 'Video overview',
    description: 'Watch a 4-minute introduction to key workflows and collaboration tips.',
    href: '#video-overview',
  },
]

const knowledgeBase = [
  {
    category: 'Upload & Validation',
    items: [
      { title: 'Preparing a CSV import', summary: 'Required columns, carrier-specific templates, and validation thresholds.' },
      { title: 'Understanding data quality badges', summary: 'How completeness scores and validation errors are calculated.' },
    ],
  },
  {
    category: 'Analytics Insights',
    items: [
      { title: 'Building stop-loss scenarios', summary: 'Configure deductible corridors, triggers, and reimbursement assumptions.' },
      { title: 'Benchmark comparisons', summary: 'Overlay industry benchmark files and interpret variance markers.' },
    ],
  },
  {
    category: 'Collaboration & Sharing',
    items: [
      { title: 'Publishing a report pack', summary: 'Generate sharable PDF bundles and schedule recurring deliveries.' },
      { title: 'Workspace activity log', summary: 'Trace file lineage, review audit events, and export access logs.' },
    ],
  },
]

const faqs = [
  {
    question: 'How do I invite teammates and manage permissions?',
    answer:
      'From the dashboard settings panel, add users with Viewer, Contributor, or Admin roles. Each role controls access to uploads, report templates, and data exports.',
  },
  {
    question: 'Which carriers are supported by automatic mapping?',
    answer:
      'Anthem, UnitedHealthcare, Aetna, Cigna, and Express Scripts imports are mapped automatically. Custom layouts can be saved as reusable field templates.',
  },
  {
    question: 'Can I schedule recurring data refreshes?',
    answer:
      'Yes. Use the "Automations" tab to define daily, weekly, or monthly refreshes. You can also configure webhook triggers for upstream systems.',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 shadow-sm dark:border-blue-900 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Help Center</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
                Everything you need to launch confidently
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300">
                Browse guides, tutorials, and sample assets to accelerate onboarding. Reach out anytime for tailored implementation support.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href="mailto:support@healthdash.example.com"
                className="inline-flex items-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact support
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average response time: under 2 hours</p>
            </div>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quick start</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Jump into the essential resources hand-picked for first-time analysts.
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickStartItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group relative flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Featured</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 dark:text-blue-300">
                  Open resource
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="video-overview" className="mt-16">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Video overview</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Get a guided walkthrough covering uploads, data quality insights, dashboard customization, and report scheduling. Share this clip with new team members to accelerate onboarding.
              </p>
              <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-200">
                Tip: Enable captions and adjust playback speed for working sessions.
              </p>
            </div>
            <div className="lg:col-span-3">
              <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/80 shadow-lg ring-1 ring-slate-200/80 dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-700/40">
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="text-sm font-semibold text-white">Video tour coming soon</p>
                    <p className="mt-2 text-xs text-slate-300">
                      Recordings publish after the first private beta cohort. Subscribe to updates in the notification center.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Knowledge base</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deep dives into the workflows powering claims analytics and stop-loss modeling.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {knowledgeBase.map((section) => (
              <div key={section.category} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{section.category}</h3>
                <ul className="mt-4 space-y-4">
                  {section.items.map((item) => (
                    <li key={item.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{item.summary}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm dark:border-amber-600/40 dark:bg-amber-900/20">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Onboarding playbook</p>
              <h2 className="mt-2 text-2xl font-semibold text-amber-900 dark:text-amber-100">Track adoption milestones as you roll out the platform</h2>
              <p className="mt-3 text-sm text-amber-800/80 dark:text-amber-100/80">
                Use the adoption tracker to monitor upload success, dashboard configuration completion, and report scheduling. Each step includes recommended roles and estimated time commitments.
              </p>
              <Link
                href="/resources/implementation-timeline.md"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-600 hover:text-amber-900 dark:border-amber-400 dark:text-amber-200"
              >
                Download onboarding checklist
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h6m-6 5h10M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
                </svg>
              </Link>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-6 dark:border-amber-500/50 dark:bg-amber-950/40">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Adoption milestones</h3>
              <ol className="mt-4 space-y-3 text-sm text-amber-900/90 dark:text-amber-100/80">
                <li><span className="font-semibold">Week 1:</span> Upload first carrier file and confirm validations</li>
                <li><span className="font-semibold">Week 2:</span> Configure stop-loss scenarios and share insights</li>
                <li><span className="font-semibold">Week 3:</span> Automate exports, enable notifications, and invite collaborators</li>
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Frequently asked questions</h2>
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition open:border-blue-300 open:bg-blue-50/70 dark:border-slate-800 dark:bg-slate-900/70 dark:open:border-blue-700/60 dark:open:bg-blue-900/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <span>{faq.question}</span>
                  <svg className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Still need a hand?</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Join the weekly office hours or submit a detailed question. We also provide live onboarding for enterprise clients.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="mailto:solutions@healthdash.example.com"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
                  </svg>
                  Submit a ticket
                </Link>
                <Link
                  href="https://calendar.example.com/healthdash-office-hours"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Reserve office hours
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Status & reliability</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• Platform uptime: 99.95% (last 90 days)</li>
                <li>• Data refresh SLA: 20 minutes</li>
                <li>• SOC 2 Type II and HIPAA controls verified quarterly</li>
              </ul>
              <Link
                href="/resources/production-readiness-checklist.md"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-600 transition hover:text-blue-700 dark:text-blue-300"
              >
                View system status details
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

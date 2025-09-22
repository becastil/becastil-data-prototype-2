import Link from 'next/link'

const roiHighlights = [
  {
    label: '455% ROI',
    description: 'Average return delivered by well-implemented dashboards across industries.',
  },
  {
    label: '100+ Hours Saved',
    description: 'Weekly time savings achieved by Microsoft through workplace analytics dashboards.',
  },
  {
    label: '50% Faster Decisions',
    description: 'Organizations with live dashboards cut decision-making cycles in half.',
  },
  {
    label: '6-Month Payback',
    description: 'Typical payback period reported in Forrester enterprise dashboard studies.',
  },
]

const platformComparisons = [
  {
    name: 'Microsoft Power BI',
    positioning: 'Best overall value, seamless for Microsoft-centric teams.',
    pricing: '$14 user/month (Pro tier)',
    differentiators: [
      'Deep Office 365 integration and governance',
      'Strong AI features for natural language Q&A',
      'Financial reporting and operational dashboards out of the box',
    ],
  },
  {
    name: 'Tableau',
    positioning: 'Top-tier visualization for complex analytics teams.',
    pricing: '$70 creator/month',
    differentiators: [
      'Best-in-class custom visualization library',
      'Enterprise-grade data modeling and prep',
      'Preferred in finance, healthcare, and technology verticals',
    ],
  },
  {
    name: 'Qlik Sense',
    positioning: 'Associative engine for discovering hidden data relationships.',
    pricing: 'Custom pricing',
    differentiators: [
      'Associative data model reveals non-obvious insights',
      'Strong in retail, manufacturing, and supply chain use cases',
      'Requires dedicated onboarding to master the interface',
    ],
  },
  {
    name: 'Google Looker',
    positioning: 'Semantic model plus Google AI for conversational analytics.',
    pricing: 'Starts ~$30 user/month',
    differentiators: [
      'Excellent fit for Google Cloud Platform stacks',
      'Robust semantic modeling layer for governed self-service',
      'Younger ecosystem compared to Power BI or Tableau',
    ],
  },
]

const successStories = [
  {
    organization: 'Texas Hospital System',
    impact: 'Reduced emergency room door-to-doctor time by 32% within three months.',
    takeaway: 'Operational dashboards can translate directly into patient outcomes and staff efficiency.',
  },
  {
    organization: 'Sequoia Financial Group',
    impact: '188% ROI with one-year payback, saving 0.8 hours per user per day.',
    takeaway: 'Financial dashboards streamline advisor workflows and eliminate manual reporting.',
  },
  {
    organization: 'Microsoft Workplace Analytics',
    impact: 'Saved 100 hours weekly by optimizing meeting locations using dashboards.',
    takeaway: 'Automating insight delivery frees capacity for strategic work and collaboration.',
  },
  {
    organization: 'Emirates NBD',
    impact: 'Increased digital ROI through redesigned, user-centered dashboards.',
    takeaway: 'Customer-centric dashboard design becomes a competitive differentiator.',
  },
]

const implementationChecklist = [
  {
    title: 'Align on Business Outcomes',
    points: [
      'Define the specific decisions each dashboard must support.',
      'Document baseline pain points and measurable success criteria.',
      'Map stakeholders to the questions they need answered in 5 seconds or less.',
    ],
  },
  {
    title: 'Invest in Data Foundations',
    points: [
      'Automate validation, reconciliation, and lineage tracking before visualization.',
      'Assign data owners and governance policies for each critical data source.',
      'Address quality issues proactively to maintain user trust.',
    ],
  },
  {
    title: 'Design for Adoption',
    points: [
      'Interview users and prototype layouts around their workflows.',
      'Secure executive sponsorship and identify champion users early.',
      'Embed contextual actions so users can move from insight to action seamlessly.',
    ],
  },
  {
    title: 'Measure and Iterate',
    points: [
      'Track usage analytics to see which questions users actually answer.',
      'Survey teams on decision speed and confidence after rollout.',
      'Apply feedback in continuous release cycles rather than one-time launches.',
    ],
  },
]

const futureTrends = [
  {
    headline: 'Immersive Analytics (AR/VR)',
    description:
      'Spatial and three-dimensional storytelling will become mainstream between 2026-2028 for industries that rely on physical environments.',
  },
  {
    headline: 'Agentic AI Co-Pilots',
    description:
      'By 2028, one-third of enterprise software will embed autonomous agents that plan, execute, and escalate only exceptions.',
  },
  {
    headline: 'Voice & Multimodal Interfaces',
    description:
      'Speech, audio alerts, and gesture controls will make analytics accessible to mobile and frontline workers.',
  },
  {
    headline: 'Quantum & Biometric Data Streams',
    description:
      'Dashboards must visualize probabilistic states, biometric signals, and uncertainty envelopes beyond today’s chart types.',
  },
  {
    headline: 'Neuro-Informed Design',
    description:
      'Interfaces grounded in cognitive science will minimize time-to-insight via pre-attentive cues and chunking.',
  },
]

export default function DataDashboardsForBusinessSuccessPage() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-80" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">Research Insight</p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              Data Dashboards for Business Success
            </h1>
            <p className="mt-6 text-lg text-blue-50">
              Learn how the top 20-30% of dashboard initiatives achieve outsized ROI by blending
              business alignment, high-quality data, and deliberate change management. This field
              guide distills evidence-backed practices for healthcare, finance, and operations teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
              >
                Explore Demo Dashboard
              </Link>
              <a
                href="#business-case"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Jump to Playbook
              </a>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950" />
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="-mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="ROI highlights">
          {roiHighlights.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-blue-900/30"
            >
              <div className="text-3xl font-semibold text-white">{item.label}</div>
              <p className="mt-3 text-sm text-blue-100">{item.description}</p>
            </div>
          ))}
        </section>

        <section id="business-case" className="mt-20 space-y-8">
          <h2 className="text-3xl font-semibold text-white">The Business Case for Dashboards</h2>
          <p className="text-base text-blue-100">
            Dashboards consolidate fragmented data, surface insights instantly, and give every team a
            shared source of truth. Forrester reports $2.54 million in average benefits over three years
            with payback in under six months. Organizations with interactive dashboards are 28% more
            likely to find critical information quickly, and 80% of those with real-time analytics see
            revenue increases.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Operational Transformation</h3>
              <ul className="mt-4 space-y-2 text-sm text-blue-100">
                <li>Decisions shrink from days to minutes with live KPI visibility.</li>
                <li>Manual reporting is automated, freeing teams for higher-value work.</li>
                <li>Insights become actionable for front-line managers, not just analysts.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Financial Outcomes</h3>
              <ul className="mt-4 space-y-2 text-sm text-blue-100">
                <li>Real-time monitoring yields 10-15% throughput gains in smart factories.</li>
                <li>Self-service analytics cut information discovery time by 28%.</li>
                <li>Dashboards drive 455% ROI when paired with change management.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <h2 className="text-3xl font-semibold text-white">Market Leaders & When to Use Them</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid gap-px bg-white/10 sm:grid-cols-2">
              {platformComparisons.map((platform) => (
                <div key={platform.name} className="bg-slate-900/60 p-6">
                  <h3 className="text-xl font-semibold text-white">{platform.name}</h3>
                  <p className="mt-2 text-sm text-blue-200">{platform.positioning}</p>
                  <p className="mt-4 text-sm font-medium text-blue-100">Pricing: {platform.pricing}</p>
                  <ul className="mt-4 space-y-2 text-sm text-blue-100">
                    {platform.differentiators.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span aria-hidden className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <h2 className="text-3xl font-semibold text-white">How High Performers Win</h2>
          <p className="text-base text-blue-100">
            Across healthcare, finance, and banking, organizations see transformative outcomes when
            dashboards are embedded in daily operations. These real-world examples highlight what
            success looks like when business context guides the build.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {successStories.map((story) => (
              <div key={story.organization} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                  {story.organization}
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{story.impact}</p>
                <p className="mt-4 text-sm text-blue-100">{story.takeaway}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <h2 className="text-3xl font-semibold text-white">Implementation Playbook</h2>
          <p className="text-base text-blue-100">
            Treat dashboard projects as change initiatives. Pair technical excellence with adoption and
            governance to achieve sustainable results.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {implementationChecklist.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-blue-100">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 space-y-8">
          <h2 className="text-3xl font-semibold text-white">What&apos;s Next for Dashboards</h2>
          <p className="text-base text-blue-100">
            Dashboard strategies should anticipate rapid advances in AI, interface design, and data
            complexity. Building adaptable foundations now ensures you can capitalize on what comes
            next.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {futureTrends.map((trend) => (
              <div key={trend.headline} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white">{trend.headline}</h3>
                <p className="mt-3 text-sm text-blue-100">{trend.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Ready to operationalize these insights?</h2>
              <p className="mt-3 text-sm text-blue-100">
                Use our sample data upload workflows to experiment with live analytics, or reach out to
                map these practices onto your organization.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/upload"
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Try Sample Workflow
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/20 transition hover:bg-white/20"
              >
                Sign In to Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

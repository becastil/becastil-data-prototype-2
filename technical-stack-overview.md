# Healthcare Analytics Dashboard - Technical Stack Overview

## Executive Summary (Stack at a Glance)

**Project Overview**: Develop a secure web app for a small team to upload large health plan CSV data (from carriers like Anthem, ESI, etc.), normalize it, and produce polished 2-page PDF reports with charts, tables, and KPIs. The solution will start as a solo-developer MVP on a PaaS (e.g. Render) and later evolve into an enterprise-grade deployment.

**MVP Tech Stack**: 
- **Frontend**: Next.js 14 (React, TypeScript) with the new App Router for modern routing and performance
- **Backend**: Node.js (via Next.js API routes) for server-side CSV processing and PDF generation
- **Database**: PostgreSQL (free-tier, e.g. Render Postgres or Supabase) for structured data
- **Object Storage**: S3-compatible bucket (e.g. Cloudflare R2 or Backblaze B2 free tier) for raw CSVs & generated PDFs
- **Auth**: Passwordless email "magic link" login (NextAuth.js email provider or Magic.Link) for simplicity
- **PDF/Chart Engine**: Server-side chart rendering (Chart.js or D3 on Node) and PDF generation (e.g. Puppeteer to print React pages to PDF) for high-fidelity reports
- **Hosting**: Render for app hosting (supports Node SSR and static frontends) and job scheduling, using free/low-cost tiers during prototyping

**Enterprise Trajectory**: The design anticipates multi-client support and strong security. As usage grows, we'll migrate to AWS (or similar) with enterprise features: SSO via Okta/Azure AD, isolated VPC deployment, enhanced IAM roles, encrypted storage, and compliance measures (e.g. HIPAA-ready configuration, audit trails). The architecture will scale from ~20 users to hundreds by adding background workers, caching, and more robust infrastructure – all while maintaining cost-efficiency and data security.

---

## Recommended MVP Stack Components

### Frontend Architecture
**Next.js 14 + React Frontend**: Next.js provides a unified framework for both the UI and server-side logic (via API routes), speeding up development. The App Router in Next.js 14 enables organized routing and server components for better performance. React (with TypeScript) ensures a modular, maintainable UI. We choose Next.js for its full-stack capabilities (SSR, API routes) and ease of deployment on platforms like Vercel or Render.

**UI Component Library**: Use a mature React UI kit (e.g. Material UI or Chakra UI) for consistent, accessible components. This accelerates building forms (file upload dialog, mapping UI), tables, modals, and ensures a professional look out-of-the-box. The design system will enforce spacing, colors, and typography that carry over into the PDF styling for a polished feel.

### Backend Infrastructure
**Backend**: Leverage Next.js API routes (Node.js runtime) for backend logic. This keeps the stack simple (no separate Express server needed). Heavy operations (CSV parsing, data normalization, PDF rendering) will run in these API routes or in background jobs to avoid blocking requests. Node provides access to vast libraries (CSV parsers, PDF tools) and a single language (TypeScript) across front and back.

**Database (PostgreSQL)**: Use a relational database to store processed data and metadata. PostgreSQL is a reliable choice and available in free tiers (e.g. Supabase offers a free Postgres DB up to 500MB, or Render's free 90-day Postgres instance). We'll design a schema for multi-client data segregation and analytical queries. Postgres's JSON support could store mapping configurations or raw blob if needed, but structured tables are preferred for reporting queries.

**Object Storage**: Large raw CSVs and generated PDFs will be stored in object storage rather than in the DB (to keep the DB lean). For the MVP, we can use a free/low-cost S3-compatible service: e.g. Backblaze B2 (10 GB free) or Cloudflare R2 (10 GB storage and 1 million ops free). These services have S3 APIs so we can integrate easily using Node SDKs.

### Authentication & Security
**Authentication**: Implement simple email-based authentication with magic links (passwordless). This is low-friction for 10–20 users and avoids managing passwords. For example, NextAuth's Email provider sends a one-time login link to the user. When clicked, it verifies and signs them in. This approach is familiar (Slack-style login) and secure (links expire, single-use). Initially, we'll use a transactional email service or SMTP (e.g. Resend, SendGrid free tier) for sending the magic link emails.

**Role-Based Access Control**: Roles will be built in (admin, standard user, read-only) to restrict access to certain features or clients from the start. No social logins or SSO yet (since we control access to a small team via known emails).

### PDF Generation & Charts
**PDF Generation Engine**: For polished 2-page reports, we recommend generating PDFs server-side using HTML/CSS templates and a headless browser. Specifically, using Puppeteer to render an offscreen version of the report pages (built with React components) and export to PDF yields high fidelity. This means we can reuse our frontend components (charts, tables styled with CSS) and "print" them to PDF with consistent styling (including selectable text, vector graphics).

**Charts & Graphics**: Use the same chart library for web and PDF to ensure consistency. For example, Chart.js can run in-browser for the interactive UI and we can use chartjs-node-canvas on the server to render the same charts to image buffers for the PDF. Alternatively, the Puppeteer approach will capture the charts as rendered in React. Either way, we ensure the visuals (colors, labels, data points) in the PDF match what users see online.

### Hosting & Deployment
**Hosting on Render**: Render.com offers a developer-friendly PaaS to deploy the Next.js app (as a web service) and provides free tiers for databases and static sites. For the MVP, we'll deploy the Next.js app on a single Render web service instance (auto-build from Git). Render's free PostgreSQL can be used initially (note: it expires in 90 days by policy, so we'll plan to migrate to a persistent solution before that). Render also supports background workers and cron jobs if needed for offloading tasks.

---

## Clear Path to Enterprise-Ready Deployment

### Cloud Hosting Migration
As the user base and data scale grow, we'll migrate from Render to a cloud like AWS for more control. The app will run in a private VPC – for example, deploying the Next.js app in AWS ECS or EKS (Dockerized), behind an Application Load Balancer. Static assets could be served via CloudFront CDN. This provides better network isolation and scalability.

### Single Sign-On (SSO)
For enterprise, integrate SSO so that users can login via the company's identity provider. We'll support SAML or OAuth2/OIDC logins with providers like Okta or Azure AD. SSO will allow multi-factor auth and centralized user management. Role provisioning could be managed via identity claims (e.g. assign roles/groups in Okta that map to app roles).

### Enterprise Auth & IAM
In addition to SSO, enforce strict IAM for cloud resources. Use AWS IAM roles for the app to access S3 buckets and databases – no long-lived access keys. Secrets (DB passwords, API keys) will be stored in AWS Secrets Manager or Parameter Store (instead of .env files) and injected at runtime. Database access will be limited to the app's security group or use IAM auth (for RDS).

### Network Security
In enterprise mode, all components reside in a VPC with proper network controls. The web app will live in public subnets behind a load balancer, whereas the database and internal services (e.g. workers, cache) will be in private subnets (no direct internet). Security groups and possibly a Web Application Firewall (AWS WAF) will restrict traffic.

### Advanced Security Hardening
In an enterprise scenario, additional protections come into play. We'll enforce strict Content Security Policy (CSP) for the web app to mitigate XSS. Use library scanning and vulnerability management on dependencies. All data at rest will be encrypted (managed by cloud KMS keys, rotated regularly). For sensitive data (if any PHI is present given health data context), ensure HIPAA compliance: sign Business Associate Agreements (BAA) with cloud providers, enforce role-based access so only authorized personnel can view PHI, and implement data loss prevention (DLP) rules.

---

## Cost Estimates by Phase

### Prototype (Solo Dev, ~10-20 users): $0–$50/month
- Render web service: free tier ($0)
- Postgres DB: using Supabase free ($0) or Render free ($0)
- Object storage: likely within free limits (negligible cost)
- Email service: if low volume, free
- Other services (Redis, etc.): free tier as long as usage is low

### Small Team Deployment (~50-100 users): $50–$200/month
- Cloud Hosting: Perhaps move to a small AWS setup or paid Render plan (~$40)
- Database: A managed Postgres with more storage (~$50)
- Storage: As data grows, S3 costs might be $1-5/month
- Redis: If free becomes insufficient, ~$10-20
- Email/Notifications: ~$5-10

### Enterprise (100+ users): $200-$500/month
- Database: If handling millions of records, might need a larger instance ($200-$500/mo)
- Compute: More app servers or higher-spec to handle peak usage (~$100-$200/mo)
- Storage & Data Transfer: Accumulating data over time (~$50 if < 20GB)
- Enterprise Services: SSO integration, additional security services

---

## Key Assumptions and Design Decisions

### Data Content & Privacy
We assume the CSVs contain aggregate or de-identified claim data (no direct patient names, etc.), focusing on financial figures. If there were personal health information, we'd need to prioritize HIPAA compliance from day one.

### User Base & Security Model
Starting with ~10-20 internal users (consultants, analysts). They all have relatively high trust and training. We assume they won't maliciously try to break the system, and they can give feedback to improve it. So we can focus on features over extreme lockdown initially.

### File Processing Frequency
Likely one upload per data source per month (e.g. monthly claim feeds), not a constant stream of files. So the system is optimized for periodic batch uploads and analysis, not continuous real-time data feed.

### Migration Strategy
We assume Render will suffice for MVP and maybe initial production, but the path to AWS is there mostly for enterprise IT alignment (many enterprises prefer AWS for full control, VPC, etc.). The migration is doable because our components (Next.js, Postgres, etc.) are standard and can be re-deployed on AWS easily.

### Scope Control
We deliberately didn't include some features to meet the 2-week MVP timeline: e.g. no complex analytics beyond what's needed for the report, no user management UI (we can add users via DB or minimal admin page), no internationalization, etc. These can be added if needed later. We focus on the core value: ingest data, output a clean report.

---

## Next Steps

1. **Immediate Development**: Follow the Implementation Timeline (see `implementation-timeline.md`)
2. **Architecture Review**: See detailed technical architecture in `architecture-review.md`
3. **Production Planning**: Review production readiness checklist in `production-readiness-checklist.md`
4. **Step-by-Step Implementation**: Follow the detailed step guides (`step-1-data-input.md` through `step-4-financial-reporting.md`)

This technical stack provides a solid foundation for rapid MVP development while maintaining a clear path to enterprise-grade scalability and security.
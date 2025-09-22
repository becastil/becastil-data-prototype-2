# Healthcare Dashboard - Implementation Timeline & Checklist

## Overview

This document provides a detailed 2-week implementation timeline for building the Healthcare Analytics Dashboard MVP, followed by production hardening steps. The timeline is designed for a solo developer to deliver a functional prototype that can later evolve into an enterprise-grade application.

---

## Week 1 – MVP Foundation

### Day 1-2: Project Setup & Authentication

**Project Setup:**
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up the repository (GitHub) and enable CI (GitHub Actions) for linting/tests on push
- [ ] Deploy a hello-world to Render to verify pipeline

**Auth & User Model:**
- [ ] Install NextAuth (or implement custom magic link flow)
- [ ] Set up email provider for magic links
- [ ] Configure a temporary SMTP service
- [ ] Create a basic User model in the database
- [ ] Implement a login page where user enters email to receive a link
- [ ] Implement callback page for magic link login
- [ ] Verify that a user can log in and a session is created
- [ ] Protect routes by checking session and redirect to login if not authed

### Day 3-4: Basic Data Models & Upload

**Basic Data Models:**
- [ ] Design the initial Postgres schema (see architecture-review.md for ERD)
- [ ] Use a migration tool (Prisma or Knex or TypeORM) to create tables
- [ ] Create essential tables: Clients, Users, Uploads, Claims, Budgets
- [ ] Verify DB connection from Next.js API (e.g. a test query)

**CSV Upload Endpoint:**
- [ ] Create a page with a file upload form (with drag/drop)
- [ ] On submission, have it POST multipart/form-data to an API route (api/upload)
- [ ] In the API route, accept the file (using formidable or multer to handle file parsing)
- [ ] Implement a simple parser (e.g. csv-parser library) to read a small file
- [ ] Console log data to confirm working
- [ ] For now, assume one known format and map directly to DB fields without UI mapping

### Day 5-6: Data Ingestion & Storage

**Minimal Data Ingestion:**
- [ ] Parse the CSV (maybe an Anthem medical claims sample)
- [ ] Insert data into the Claims table
- [ ] Implement basic validation (e.g. required columns present, skip rows where amount or date is missing)
- [ ] If any error occurs, capture it
- [ ] Save the upload record in DB with status success or fail and count of rows

**Storing Files:**
- [ ] Implement saving the raw CSV in object storage
- [ ] Integrate with AWS S3 (using free tier credentials) or use a service's SDK
- [ ] Alternatively, store locally in a /uploads folder on Render for now
- [ ] Mark in Uploads table where file is stored (path or key)

### Day 7: Basic Report Generation & PDF

**Minimal Report Generation:**
- [ ] Once data is in, create a simple endpoint or page to generate a PDF
- [ ] Create a server-side function to compute a few aggregates from the data
- [ ] Calculate total claims and budget vs actual for the month
- [ ] Use a library (maybe PDFKit for quick start) or Puppeteer to generate a PDF
- [ ] For week 1, produce a small table and a dummy chart (could be an image placeholder)
- [ ] Use PDFKit to draw a table: implement a quick summary table Medical vs Pharmacy, Budget vs Actual
- [ ] This establishes the PDF pipeline

**Download PDF:**
- [ ] Ensure the PDF can be downloaded by the user
- [ ] For simplicity, generate on the fly in an API and send as response
- [ ] Test this manually – user clicks "Generate", browser downloads PDF file
- [ ] This completes the end-to-end flow (upload -> data -> report)

**Multi-Client Awareness:**
- [ ] Add the concept of client ID in relevant places
- [ ] Create a dummy client record and associate the test user with it
- [ ] Ensure the upload inserts use that client_id and queries filter by it
- [ ] This lays groundwork for multi-tenant, even if not fully utilized yet

**Testing & Demo:**
- [ ] Do a run-through: Register a user (or pre-insert in DB), login via email link
- [ ] Upload a sample CSV, check DB for data, click generate PDF, and verify PDF content
- [ ] This is the core MVP flow achieved in week 1

---

## Week 2 – Polish & Extended Features

### Day 8-9: Column Mapping & Advanced Upload

**Column Mapping UI:**
- [ ] Expand the upload flow to handle arbitrary CSV headers
- [ ] Implement a step after file upload that shows the mapping UI
- [ ] Backend upload API saves the file and returns parsed headers and first few rows
- [ ] Frontend receives that and renders a mapping form
- [ ] Build the mapping component where each required field has a select dropdown of CSV columns
- [ ] Auto-match columns by name (implement a simple helper that lowercases and compares similarity)
- [ ] Include an option to save the mapping as default for this file type

**Apply Mapping in Backend:**
- [ ] When user submits the mapping, the backend uses the provided mapping to parse and transform the CSV
- [ ] Map CSV columns to our standardized field names, then follow validation & insertion process
- [ ] Test this with slightly changed CSV headers to ensure it works

### Day 10-11: Validation & Error Handling

**Validation & Error Handling:**
- [ ] Implement the full validation rules on the backend
- [ ] Use a library or custom code to validate each row (number formats, date, etc.)
- [ ] If errors, collect them
- [ ] Create an "error CSV" file if any errors (could reuse the CSV headers and only include bad rows plus an error column)
- [ ] Store that file and/or send back error info to frontend
- [ ] On frontend, display a message like "5 rows failed validation – download error log"
- [ ] Ensure that if errors occur, we do not insert partial data (wrap in transaction or insert only valid with warning)

**Saved Mapping Profiles:**
- [ ] After a successful upload, save the mapping to DB (MappingProfiles table)
- [ ] Implement a UI on the upload page to choose an existing profile before uploading
- [ ] For example, a dropdown "Select data source" with options like "Anthem Medical (saved profile)"
- [ ] If profile chosen, skip mapping UI entirely and proceed

### Day 12-13: UI/UX & History Features

**UI/UX Improvements:**
- [ ] Refine UI layout and styling
- [ ] Make sure forms have proper labels, spacing is nice
- [ ] Add a sidebar or navbar for navigation between sections (Home/Upload, History, etc.)
- [ ] Ensure the app looks good on major browsers
- [ ] Perhaps add a logo and app name on the header for professionalism

**History Pages:**
- [ ] Implement the Upload History page: query the Uploads table for current client
- [ ] List entries in a table with date, filename, status, records, and a link to download original or error log
- [ ] Implement the Reports History page: list past ReportRuns with date, period, and link to PDF
- [ ] Store PDFs in S3 or as static files for retrieval

**Role-Based Access Control:**
- [ ] Introduce roles in the database for users and enforce in the UI
- [ ] Mark your test user as admin
- [ ] Create another user as a viewer and ensure when logged as viewer, upload page is hidden/disabled
- [ ] Also enforce on backend (if role=viewer tries to call upload API, return 403)
- [ ] This might involve adding a middleware or just checking session in each API

### Day 14: Advanced PDF & Production Prep

**Improved PDF Layout:**
- [ ] Replace the rudimentary PDF from week 1 with the real design
- [ ] Implement the Page 1 and Page 2 content fully (see step-4-financial-reporting.md for detailed specs)
- [ ] Use HTML template approach: create React components for ReportPage1 and ReportPage2
- [ ] Style them with CSS (maybe using Tailwind or plain CSS grid/flex)
- [ ] Use charts in them via a library – ensure charts can render in Node
- [ ] Draw tables for financials (could just use HTML table styling for PDF)
- [ ] Insert dynamic values from DB queries: e.g. sum of claims by category, etc.
- [ ] Implement aggregation queries or use an ORM to compute totals and metrics
- [ ] Test the PDF output thoroughly with sample data – check formatting, page breaks, etc.

**Security & Config Polishing:**
- [ ] Move any sensitive constants (e.g. JWT secret, SMTP creds) to environment config
- [ ] Ensure no secrets in client bundle
- [ ] Double-check that no API returns sensitive data inadvertently
- [ ] Enable CORS only for our domain
- [ ] Possibly add a Content Security Policy meta tag

**Documentation & Handoff:**
- [ ] Write README instructions for how to run the app
- [ ] Document how to set up env (especially for emailing if they test magic links locally)
- [ ] Document how to switch from Render to AWS (at least high-level steps)
- [ ] Compile a list of all the free accounts/services used and their limits

**Testing:**
- [ ] Conduct integration tests for the main flows: sign up/in, upload with mapping, error case, successful case, generate report
- [ ] Fix any bugs found (for example, mapping not applied correctly, or PDF layout issues)
- [ ] Test concurrency a bit: upload two files in quick succession to see if any race conditions
- [ ] Fix accordingly (like use unique IDs for file names)

---

## Post-MVP: Prepare for Enterprise (Optional Week 3)

### Background Worker Setup
- [ ] Set up a separate process or script for handling queue jobs
- [ ] For Render, create a "background worker" instance that runs a script
- [ ] Implement job queue for at least the PDF generation
- [ ] When user requests PDF, enqueue and immediately return "Report generation in progress"
- [ ] Use websockets or polling to notify completion
- [ ] Document that moving to background tasks is needed for scale

### Enterprise Preparation
- [ ] Set up configuration for dev vs prod (using .env.local vs .env.production files)
- [ ] Write a Terraform or CloudFormation script skeleton that could create AWS RDS, S3, etc.
- [ ] Include SSO placeholders: e.g. have an env switch that if enabled, would use Okta OpenID instead of NextAuth email
- [ ] Integrate a simple logger that can switch to JSON output for CloudWatch easily
- [ ] Add Helmet for security headers (small effort)
- [ ] Ensure the app can run behind a proxy or custom domain easily

### Operational Checklist for Production
- [ ] Obtain custom domain and SSL cert (if not using Render's)
- [ ] Set up monitoring/alerting contacts
- [ ] Plan backup procedures for DB and storage
- [ ] Load test with sample large files to ensure performance
- [ ] Engage security review before going live with real data

---

## Critical Success Factors

### Week 1 Success Criteria
By the end of Week 1, you should have:
- ✅ A working authentication system with magic links
- ✅ Ability to upload CSV files and store them
- ✅ Basic data processing and database storage
- ✅ Simple PDF generation and download
- ✅ End-to-end user flow from upload to report

### Week 2 Success Criteria
By the end of Week 2, you should have:
- ✅ Flexible CSV column mapping for different file formats
- ✅ Comprehensive data validation and error handling
- ✅ Professional 2-page PDF reports with charts and tables
- ✅ Upload and report history tracking
- ✅ Role-based access control
- ✅ Production-ready styling and UX

### Risk Mitigation
**Common Pitfalls to Avoid:**
- Don't spend too much time on perfect UI in Week 1 – focus on functionality
- Keep PDF generation simple initially – elaborate designs can come in Week 2
- Use known, stable libraries rather than experimenting with new tech
- Test the end-to-end flow frequently to catch integration issues early
- Have backup plans for services (e.g. if Render has issues, be ready to deploy to Vercel)

**Scope Control:**
- If running behind schedule, defer advanced features like background workers to Week 3
- The core value is: upload CSV → generate professional PDF report
- Everything else is enhancement that can be added incrementally

---

## Technology Stack Decisions

### Why Next.js + Node.js?
- **Single Language**: TypeScript across frontend and backend
- **Rapid Development**: Next.js API routes eliminate need for separate backend
- **Easy Deployment**: Works well with platforms like Render and Vercel
- **Rich Ecosystem**: Access to vast npm libraries for CSV parsing, PDF generation, etc.

### Why PostgreSQL?
- **Relational Structure**: Perfect for normalized healthcare data
- **JSON Support**: Can store flexible configurations
- **Free Tiers Available**: Both Supabase and Render offer free PostgreSQL
- **Enterprise Ready**: Easy to scale to AWS RDS when needed

### Why Magic Link Auth?
- **User Friendly**: No passwords to remember or reset
- **Secure**: Single-use tokens with expiration
- **Low Maintenance**: No password complexity requirements
- **Enterprise Ready**: Easy to replace with SSO later

This timeline provides a realistic path from zero to a functional healthcare analytics dashboard in just 2 weeks, with clear checkpoints and success criteria at each stage.
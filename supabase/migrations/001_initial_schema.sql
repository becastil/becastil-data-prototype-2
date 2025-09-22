-- Healthcare Analytics Dashboard Database Schema

-- Enable RLS (Row Level Security)
alter database postgres set "app.jwt_secret" to 'your-jwt-secret-here';

-- Organizations table for multi-tenancy
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User profiles linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text default 'user' check (role in ('admin', 'user', 'readonly')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Raw claims data table
create table public.claims_data (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  upload_session_id uuid not null, -- Groups claims from same upload
  
  -- Core claim fields
  claimant_id text not null,
  claim_date date not null,
  service_type text not null,
  medical_amount decimal(12,2) default 0,
  pharmacy_amount decimal(12,2) default 0,
  total_amount decimal(12,2) not null,
  
  -- Optional fields
  icd_code text,
  medical_desc text,
  layman_term text,
  provider text,
  location text,
  
  -- Processed fields
  month_key text not null, -- YYYY-MM format
  stop_loss_triggered boolean default false,
  stop_loss_excess decimal(12,2) default 0,
  stop_loss_reimbursement decimal(12,2) default 0,
  net_paid decimal(12,2) not null,
  
  -- Metadata
  original_row jsonb, -- Store original CSV row data
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Indexes for performance
  constraint claims_data_month_key_check check (month_key ~ '^\d{4}-\d{2}$')
);

-- CSV upload sessions for tracking imports
create table public.upload_sessions (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  
  filename text not null,
  file_size bigint not null,
  mime_type text not null,
  
  -- Processing status
  status text default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_rows integer,
  processed_rows integer default 0,
  failed_rows integer default 0,
  
  -- Field mappings used during import
  field_mappings jsonb,
  
  -- Error details if failed
  error_message text,
  error_details jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Organization configurations
create table public.configurations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  
  name text not null,
  is_default boolean default false,
  
  -- Configuration data
  config jsonb not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Only one default config per organization
  constraint unique_default_per_org unique(organization_id) where (is_default = true)
);

-- Generated reports
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  
  title text not null,
  report_type text not null check (report_type in ('financial_summary', 'claims_analysis', 'stop_loss')),
  
  -- Report configuration
  config jsonb not null,
  
  -- File storage
  file_url text, -- URL to generated PDF
  file_size bigint,
  
  -- Status
  status text default 'generating' check (status in ('generating', 'completed', 'failed')),
  error_message text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Audit log for compliance
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  
  action text not null,
  resource_type text not null,
  resource_id uuid,
  
  -- Audit details (don't store PHI)
  metadata jsonb,
  ip_address inet,
  user_agent text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_claims_data_org_month on public.claims_data(organization_id, month_key);
create index idx_claims_data_claimant on public.claims_data(organization_id, claimant_id);
create index idx_claims_data_upload_session on public.claims_data(upload_session_id);
create index idx_claims_data_service_type on public.claims_data(organization_id, service_type);
create index idx_upload_sessions_org on public.upload_sessions(organization_id, created_at desc);
create index idx_reports_org on public.reports(organization_id, created_at desc);
create index idx_audit_logs_org on public.audit_logs(organization_id, created_at desc);

-- Enable Row Level Security
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.claims_data enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.configurations enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;

-- Triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_organizations_updated_at
  before update on public.organizations
  for each row execute procedure public.handle_updated_at();

create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_claims_data_updated_at
  before update on public.claims_data
  for each row execute procedure public.handle_updated_at();

create trigger handle_configurations_updated_at
  before update on public.configurations
  for each row execute procedure public.handle_updated_at();
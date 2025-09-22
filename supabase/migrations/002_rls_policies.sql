-- Row Level Security Policies for Healthcare Analytics Dashboard

-- Helper function to get user's organization
create or replace function public.get_user_organization_id()
returns uuid as $$
begin
  return (
    select organization_id 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    select role = 'admin' 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Organizations policies
create policy "Users can view their organization"
  on public.organizations for select
  using (id = get_user_organization_id());

create policy "Admins can update their organization"
  on public.organizations for update
  using (id = get_user_organization_id() and is_admin());

-- Profiles policies
create policy "Users can view profiles in their organization"
  on public.profiles for select
  using (organization_id = get_user_organization_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Admins can insert new profiles in their organization"
  on public.profiles for insert
  with check (organization_id = get_user_organization_id() and is_admin());

create policy "Admins can update profiles in their organization"
  on public.profiles for update
  using (organization_id = get_user_organization_id() and is_admin());

-- Claims data policies (most restrictive - contains PHI)
create policy "Users can view claims in their organization"
  on public.claims_data for select
  using (organization_id = get_user_organization_id());

create policy "Users can insert claims in their organization"
  on public.claims_data for insert
  with check (organization_id = get_user_organization_id());

create policy "Admins can update claims in their organization"
  on public.claims_data for update
  using (organization_id = get_user_organization_id() and is_admin());

create policy "Admins can delete claims in their organization"
  on public.claims_data for delete
  using (organization_id = get_user_organization_id() and is_admin());

-- Upload sessions policies
create policy "Users can view upload sessions in their organization"
  on public.upload_sessions for select
  using (organization_id = get_user_organization_id());

create policy "Users can create upload sessions in their organization"
  on public.upload_sessions for insert
  with check (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

create policy "Users can update their own upload sessions"
  on public.upload_sessions for update
  using (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

-- Configurations policies
create policy "Users can view configurations in their organization"
  on public.configurations for select
  using (organization_id = get_user_organization_id());

create policy "Users can create configurations in their organization"
  on public.configurations for insert
  with check (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

create policy "Users can update their own configurations"
  on public.configurations for update
  using (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

create policy "Admins can update any configuration in their organization"
  on public.configurations for update
  using (organization_id = get_user_organization_id() and is_admin());

-- Reports policies
create policy "Users can view reports in their organization"
  on public.reports for select
  using (organization_id = get_user_organization_id());

create policy "Users can create reports in their organization"
  on public.reports for insert
  with check (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

create policy "Users can update their own reports"
  on public.reports for update
  using (
    organization_id = get_user_organization_id() and
    user_id = auth.uid()
  );

-- Audit logs policies (read-only for most users)
create policy "Admins can view audit logs in their organization"
  on public.audit_logs for select
  using (organization_id = get_user_organization_id() and is_admin());

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true); -- Service role can always insert audit logs

-- Functions to create audit logs
create or replace function public.log_audit_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid default null,
  p_metadata jsonb default null
)
returns void as $$
begin
  insert into public.audit_logs (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
  ) values (
    get_user_organization_id(),
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
end;
$$ language plpgsql security definer;

-- Trigger to automatically log certain events
create or replace function public.audit_trigger()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    perform log_audit_event(
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(NEW)
    );
    return NEW;
  elsif TG_OP = 'UPDATE' then
    perform log_audit_event(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
    );
    return NEW;
  elsif TG_OP = 'DELETE' then
    perform log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)
    );
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Add audit triggers to sensitive tables
create trigger audit_claims_data
  after insert or update or delete on public.claims_data
  for each row execute procedure public.audit_trigger();

create trigger audit_upload_sessions
  after insert or update on public.upload_sessions
  for each row execute procedure public.audit_trigger();

create trigger audit_reports
  after insert or update or delete on public.reports
  for each row execute procedure public.audit_trigger();
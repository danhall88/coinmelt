-- RLS Policies — tenant isolation
-- Every table is scoped to the authenticated user's org_id

alter table organizations enable row level security;
alter table users enable row level security;
alter table reps enable row level security;
alter table comp_plans enable row level security;
alter table plan_assignments enable row level security;
alter table import_jobs enable row level security;
alter table transactions enable row level security;
alter table quotas enable row level security;
alter table mbo_scores enable row level security;
alter table fx_rates enable row level security;
alter table calculation_runs enable row level security;
alter table calculation_results enable row level security;
alter table draw_balances enable row level security;
alter table clawback_events enable row level security;
alter table plan_conversations enable row level security;
alter table exports enable row level security;

-- Helper: get current user's org_id
create or replace function auth_org_id() returns uuid
  language sql stable
  as $$ select org_id from users where id = auth.uid() $$;

-- Organizations: users can only see their own org
create policy "org_read" on organizations
  for select using (id = auth_org_id());

create policy "org_update" on organizations
  for update using (id = auth_org_id());

-- Users: scoped to same org
create policy "users_read" on users
  for select using (org_id = auth_org_id());

create policy "users_insert" on users
  for insert with check (org_id = auth_org_id());

create policy "users_update" on users
  for update using (org_id = auth_org_id());

-- All other tables: standard org isolation pattern
do $$ 
declare
  tbl text;
begin
  foreach tbl in array array[
    'reps', 'comp_plans', 'plan_assignments', 'import_jobs',
    'transactions', 'quotas', 'mbo_scores', 'fx_rates',
    'calculation_runs', 'calculation_results', 'draw_balances',
    'clawback_events', 'plan_conversations', 'exports'
  ] loop
    execute format('
      create policy "%s_org_isolation" on %s
        using (org_id = auth_org_id())
        with check (org_id = auth_org_id())
    ', tbl, tbl);
  end loop;
end $$;

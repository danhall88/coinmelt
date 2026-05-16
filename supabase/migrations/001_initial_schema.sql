-- ICM App — Initial Schema
-- All tables include org_id for row-level security multi-tenancy

-- ORGANIZATIONS (tenants)
create table if not exists organizations (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text unique not null,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text default 'trialing',
  seat_count              int default 5,
  plan_tier               text default 'starter', -- starter, growth, pro
  created_at              timestamptz default now(),
  settings                jsonb default '{}'
);

-- USERS
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  org_id       uuid not null references organizations(id) on delete cascade,
  email        text not null,
  full_name    text,
  role         text not null default 'viewer', -- admin, manager, viewer
  created_at   timestamptz default now(),
  last_login_at timestamptz,
  is_active    bool default true
);

-- REPS (sales people — distinct from platform users)
create table if not exists reps (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  external_id       text,
  name              text not null,
  email             text not null,
  role              text,
  territory         text,
  tags              text[] default '{}',
  hire_date         date,
  termination_date  date,
  role_change_date  date,
  previous_role     text,
  custom_fields     jsonb default '{}',
  created_at        timestamptz default now(),
  unique(org_id, email)
);

-- COMP PLANS (stores the DSL)
create table if not exists comp_plans (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  name            text not null,
  version         int not null default 1,
  status          text not null default 'draft', -- draft, active, archived
  dsl             jsonb not null,
  effective_from  date not null,
  effective_to    date,
  period          text not null default 'monthly',
  created_by      uuid references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  source_prompts  text[] default '{}',
  llm_confidence  float,
  requires_review bool default false,
  review_notes    text[] default '{}'
);

-- PLAN ASSIGNMENTS
create table if not exists plan_assignments (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  plan_id         uuid not null references comp_plans(id) on delete cascade,
  rep_id          uuid not null references reps(id) on delete cascade,
  effective_from  date not null,
  effective_to    date,
  created_at      timestamptz default now(),
  unique(rep_id, plan_id, effective_from)
);

-- IMPORT JOBS
create table if not exists import_jobs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  type          text not null, -- transactions, quotas, reps, fx_rates, mbo_scores
  status        text not null default 'pending',
  file_path     text,
  row_count     int,
  error_log     jsonb,
  imported_by   uuid references users(id),
  created_at    timestamptz default now(),
  completed_at  timestamptz
);

-- TRANSACTIONS
create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  import_job_id   uuid references import_jobs(id),
  external_id     text,
  rep_id          uuid references reps(id),
  rep_external_id text,
  close_date      date not null,
  amount          numeric(18,4) not null,
  currency        text not null default 'USD',
  product_tag     text,
  is_new_logo     bool default false,
  territory       text,
  split_percent   numeric(5,4) default 1.0,
  custom_fields   jsonb default '{}',
  created_at      timestamptz default now()
);

-- QUOTAS
create table if not exists quotas (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  rep_id        uuid not null references reps(id) on delete cascade,
  import_job_id uuid references import_jobs(id),
  period_start  date not null,
  period_end    date not null,
  metric_id     text not null,
  value         numeric(18,4) not null,
  currency      text,
  created_at    timestamptz default now(),
  unique(rep_id, metric_id, period_start)
);

-- MBO SCORES
create table if not exists mbo_scores (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  rep_id        uuid not null references reps(id) on delete cascade,
  plan_id       uuid references comp_plans(id),
  period_start  date not null,
  objective_id  text not null,
  score         numeric(4,3) not null check (score between 0 and 1),
  entered_by    uuid references users(id),
  created_at    timestamptz default now(),
  unique(rep_id, period_start, objective_id)
);

-- FX RATES
create table if not exists fx_rates (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  from_currency   text not null,
  to_currency     text not null,
  rate            numeric(18,8) not null,
  effective_date  date not null,
  created_at      timestamptz default now(),
  unique(org_id, from_currency, to_currency, effective_date)
);

-- CALCULATION RUNS
create table if not exists calculation_runs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  plan_id       uuid not null references comp_plans(id),
  period_start  date not null,
  period_end    date not null,
  status        text not null default 'pending',
  triggered_by  uuid references users(id),
  started_at    timestamptz,
  completed_at  timestamptz,
  error_log     jsonb,
  summary       jsonb,
  created_at    timestamptz default now()
);

-- CALCULATION RESULTS (per-rep, per-run)
create table if not exists calculation_results (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references organizations(id) on delete cascade,
  run_id                   uuid not null references calculation_runs(id) on delete cascade,
  rep_id                   uuid not null references reps(id),
  plan_id                  uuid not null references comp_plans(id),
  period_start             date not null,
  period_end               date not null,
  total_earned             numeric(18,4) not null,
  currency                 text not null,
  component_results        jsonb,
  spif_earnings            jsonb,
  accelerator_applications jsonb,
  draw_adjustment          numeric(18,4),
  clawback_adjustment      numeric(18,4),
  mbo_multiplier           numeric(8,4),
  audit_trail              jsonb,
  status                   text default 'pending', -- pending, approved, disputed, paid
  approved_by              uuid references users(id),
  approved_at              timestamptz,
  created_at               timestamptz default now(),
  unique(run_id, rep_id)
);

-- DRAW BALANCES
create table if not exists draw_balances (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,
  rep_id              uuid not null references reps(id) on delete cascade,
  plan_id             uuid not null references comp_plans(id),
  outstanding_amount  numeric(18,4) not null default 0,
  currency            text not null,
  last_updated        timestamptz default now(),
  unique(rep_id, plan_id)
);

-- CLAWBACK EVENTS
create table if not exists clawback_events (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,
  rep_id              uuid not null references reps(id),
  transaction_id      uuid references transactions(id),
  trigger_type        text not null,
  original_earned     numeric(18,4),
  clawback_amount     numeric(18,4),
  applied_to_run_id   uuid references calculation_runs(id),
  created_at          timestamptz default now()
);

-- PLAN CONVERSATIONS (chat history that built the plan)
create table if not exists plan_conversations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  plan_id    uuid references comp_plans(id),
  messages   jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- EXPORTS
create table if not exists exports (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  run_id       uuid references calculation_runs(id),
  type         text not null, -- pdf_statement, csv_summary, csv_detail
  file_path    text,
  generated_by uuid references users(id),
  created_at   timestamptz default now()
);

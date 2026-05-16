-- Performance indexes

create index if not exists idx_transactions_org_rep_date
  on transactions(org_id, rep_id, close_date);

create index if not exists idx_transactions_org_date
  on transactions(org_id, close_date);

create index if not exists idx_quotas_rep_metric_period
  on quotas(rep_id, metric_id, period_start);

create index if not exists idx_calc_results_run_rep
  on calculation_results(run_id, rep_id);

create index if not exists idx_calc_results_org_period
  on calculation_results(org_id, period_start);

create index if not exists idx_plan_assignments_rep_dates
  on plan_assignments(rep_id, effective_from, effective_to);

create index if not exists idx_calc_runs_org_plan
  on calculation_runs(org_id, plan_id, period_start);

create index if not exists idx_reps_org_email
  on reps(org_id, email);

create index if not exists idx_reps_org_external_id
  on reps(org_id, external_id);

create index if not exists idx_transactions_import_job
  on transactions(import_job_id);

create index if not exists idx_comp_plans_org_status
  on comp_plans(org_id, status);

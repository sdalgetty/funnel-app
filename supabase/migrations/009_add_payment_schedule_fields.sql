-- Add fields to support payment scheduling for forecasting
alter table payments 
  add column if not exists expected_date date,
  add column if not exists is_expected boolean default false;

-- Add index for faster lookups
create index if not exists idx_payments_expected_date on payments(expected_date);
create index if not exists idx_payments_is_expected on payments(is_expected);


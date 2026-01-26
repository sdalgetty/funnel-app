-- Add bookings revenue goal and cash goal columns to funnels table
-- These will be stored in cents, consistent with other revenue fields

alter table funnels 
  add column if not exists bookings_revenue_goal_cents bigint,
  add column if not exists cash_goal_cents bigint;

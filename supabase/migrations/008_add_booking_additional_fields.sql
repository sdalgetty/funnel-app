-- Add missing fields to bookings table
alter table bookings 
  add column if not exists date_inquired date,
  add column if not exists project_date date,
  add column if not exists booked_revenue bigint default 0;


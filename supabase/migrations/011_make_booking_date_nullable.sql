-- Make booking_date nullable to allow bookings without a booked date
-- (e.g., album upgrades that don't have a traditional booking date)
alter table bookings 
  alter column booking_date drop not null;



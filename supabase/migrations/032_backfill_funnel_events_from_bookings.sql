-- Backfill funnel_events from bookings and payments for daily accuracy

-- Bookings -> closes (count)
with booking_events as (
  select
    b.user_id,
    b.id as source_id,
    b.booking_date as event_date,
    b.booked_revenue as booked_revenue
  from bookings b
  join service_types st on st.id = b.service_type_id
  where st.tracks_in_funnel is true
    and b.booking_date is not null
)
insert into funnel_events (user_id, metric, value, event_date, source, source_id)
select user_id, 'closes', 1, event_date::date, 'booking', source_id
from booking_events
on conflict (user_id, source, metric, source_id)
do update set value = excluded.value, event_date = excluded.event_date, updated_at = now();

-- Bookings -> bookings (revenue)
with booking_events as (
  select
    b.user_id,
    b.id as source_id,
    b.booking_date as event_date,
    b.booked_revenue as booked_revenue
  from bookings b
  join service_types st on st.id = b.service_type_id
  where st.tracks_in_funnel is true
    and b.booking_date is not null
)
insert into funnel_events (user_id, metric, value, event_date, source, source_id)
select user_id, 'bookings', coalesce(booked_revenue, 0), event_date::date, 'booking', source_id
from booking_events
on conflict (user_id, source, metric, source_id)
do update set value = excluded.value, event_date = excluded.event_date, updated_at = now();

-- Payments -> cash (amount)
with payment_events as (
  select
    p.user_id,
    p.id as source_id,
    coalesce(p.expected_date, p.payment_date) as event_date,
    coalesce(p.amount_cents, 0) as amount_value
  from payments p
  where coalesce(p.expected_date, p.payment_date) is not null
)
insert into funnel_events (user_id, metric, value, event_date, source, source_id)
select user_id, 'cash', amount_value, event_date::date, 'payment', source_id
from payment_events
on conflict (user_id, source, metric, source_id)
do update set value = excluded.value, event_date = excluded.event_date, updated_at = now();

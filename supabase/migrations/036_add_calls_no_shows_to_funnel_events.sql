-- Extend funnel_events metric CHECK to include callsNoShows
ALTER TABLE funnel_events
DROP CONSTRAINT IF EXISTS funnel_events_metric_check;

ALTER TABLE funnel_events
ADD CONSTRAINT funnel_events_metric_check CHECK (
  metric = ANY (ARRAY[
    'inquiries'::text,
    'confirmedAvailable'::text,
    'callsBooked'::text,
    'callsCancelled'::text,
    'callsNoShows'::text,
    'callsTaken'::text,
    'closes'::text,
    'bookings'::text,
    'cash'::text,
    'adsLead'::text,
    'adsSpend'::text
  ])
);

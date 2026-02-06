alter table public.user_profiles
add column if not exists welcome_video_watched_at timestamptz;

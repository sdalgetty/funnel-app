update public.user_profiles
set welcome_video_watched_at = null
where welcome_video_watched_at is not null;

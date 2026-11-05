CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE provider_t AS ENUM ('openai', 'gemini');
CREATE TYPE tone_t AS ENUM ('formal', 'casual', 'playful', 'professional', 'friendly');
CREATE TYPE logo_mode_t AS ENUM ('none', 'prompt', 'watermark', 'both');
CREATE TYPE kit_status_t AS ENUM ('not_started', 'in_progress', 'complete');
CREATE TYPE generation_status_t AS ENUM ('pending', 'processing', 'succeeded', 'failed');
CREATE TYPE platform_preset_t AS ENUM (
  'instagram_post', 'instagram_story', 'instagram_reel_cover',
  'facebook_post', 'facebook_cover', 'facebook_story',
  'twitter_post', 'twitter_header',
  'linkedin_post', 'linkedin_banner',
  'tiktok_video_cover',
  'youtube_thumbnail', 'youtube_banner'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION all_hex_colors(color_values TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(bool_and(v ~* '^#[0-9A-F]{6}$'), TRUE)
  FROM unnest(color_values) AS t(v);
$$;

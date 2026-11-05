CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT CHECK (
    full_name IS NULL OR char_length(btrim(full_name)) BETWEEN 2 AND 120
  ),
  avatar_url TEXT CHECK (
    avatar_url IS NULL OR avatar_url ~ '^https?://.+'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  logo_path TEXT CHECK (
    logo_path IS NULL
    OR logo_path ~ '^brands/[0-9a-f-]+/logo\.[A-Za-z0-9]+$'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_brands_owner_name_ci
  ON brands(owner_user_id, lower(name));
CREATE INDEX idx_brands_owner_created
  ON brands(owner_user_id, created_at DESC);

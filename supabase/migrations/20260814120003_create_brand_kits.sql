CREATE TABLE brand_kits (
  brand_id UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  tagline TEXT CHECK (tagline IS NULL OR char_length(tagline) <= 160),
  tone tone_t,
  audience TEXT CHECK (audience IS NULL OR char_length(btrim(audience)) BETWEEN 2 AND 500),
  colors TEXT[] NOT NULL DEFAULT '{}',
  avoid_words TEXT,
  summary TEXT,
  status kit_status_t NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (cardinality(colors) <= 3),
  CHECK (all_hex_colors(colors)),
  CHECK (
    status <> 'complete'
    OR (tone IS NOT NULL AND audience IS NOT NULL AND cardinality(colors) >= 1)
  ),
  CHECK (
    (status = 'complete' AND completed_at IS NOT NULL)
    OR (status <> 'complete' AND completed_at IS NULL)
  )
);

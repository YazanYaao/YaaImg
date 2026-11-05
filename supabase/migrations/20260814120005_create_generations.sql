CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL CHECK (char_length(btrim(prompt)) BETWEEN 3 AND 4000),
  provider provider_t NOT NULL,
  model TEXT NOT NULL CHECK (char_length(model) BETWEEN 3 AND 100),
  platform_preset platform_preset_t NOT NULL,
  width INT NOT NULL CHECK (width BETWEEN 256 AND 4096),
  height INT NOT NULL CHECK (height BETWEEN 256 AND 4096),
  logo_mode logo_mode_t NOT NULL DEFAULT 'none',
  status generation_status_t NOT NULL DEFAULT 'pending',
  provider_request_id TEXT,
  image_path TEXT CHECK (
    image_path IS NULL
    OR image_path ~ '^brands/[0-9a-f-]+/generations/[0-9a-f-]+\.png$'
  ),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK (
    (status = 'succeeded'
      AND image_path IS NOT NULL
      AND error_code IS NULL
      AND error_message IS NULL
      AND completed_at IS NOT NULL)
    OR
    (status = 'failed'
      AND image_path IS NULL
      AND error_code IS NOT NULL
      AND completed_at IS NOT NULL)
    OR
    (status IN ('pending', 'processing')
      AND image_path IS NULL
      AND error_code IS NULL
      AND error_message IS NULL
      AND completed_at IS NULL)
  )
);

CREATE INDEX idx_generations_brand_created
  ON generations(brand_id, created_at DESC);
CREATE INDEX idx_generations_brand_status_created
  ON generations(brand_id, status, created_at DESC);
CREATE INDEX idx_generations_brand_provider_created
  ON generations(brand_id, provider, created_at DESC);

CREATE TABLE provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  provider provider_t NOT NULL,
  vault_secret_id UUID NOT NULL,
  label TEXT CHECK (label IS NULL OR char_length(label) <= 100),
  key_hint TEXT CHECK (key_hint IS NULL OR key_hint ~ '^[A-Za-z0-9_-]{2,16}$'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_valid BOOLEAN,
  last_validated_at TIMESTAMPTZ,
  last_validation_error TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one active key per brand/provider, while still allowing historical keys.
CREATE UNIQUE INDEX uq_provider_keys_one_active
  ON provider_keys(brand_id, provider)
  WHERE is_active;

CREATE INDEX idx_provider_keys_lookup
  ON provider_keys(brand_id, provider, created_at DESC);

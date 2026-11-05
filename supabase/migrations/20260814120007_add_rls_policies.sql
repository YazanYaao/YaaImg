CREATE OR REPLACE FUNCTION is_brand_owner(p_brand_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM brands b
    WHERE b.id = p_brand_id
      AND b.owner_user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION is_brand_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_brand_owner(UUID) TO authenticated;

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands FORCE ROW LEVEL SECURITY;

CREATE POLICY brands_select ON brands FOR SELECT
  USING (owner_user_id = auth.uid());

CREATE POLICY brands_insert ON brands FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY brands_update ON brands FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY brands_delete ON brands FOR DELETE
  USING (owner_user_id = auth.uid());

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

CREATE POLICY profiles_owner_all ON profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits FORCE ROW LEVEL SECURITY;

CREATE POLICY brand_kits_owner_all ON brand_kits FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));

ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY provider_keys_owner_all ON provider_keys FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations FORCE ROW LEVEL SECURITY;

CREATE POLICY generations_owner_all ON generations FOR ALL
  USING (is_brand_owner(brand_id))
  WITH CHECK (is_brand_owner(brand_id));

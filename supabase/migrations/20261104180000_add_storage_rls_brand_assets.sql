-- ============================================================================
-- Migration: Add Storage RLS Policies for brand-assets Bucket
-- Allows authenticated users to upload/update/delete brand assets,
-- and public access to read them.
-- ============================================================================

-- 1. Ensure bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow authenticated users to upload (INSERT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated uploads to brand-assets'
    ) THEN
        CREATE POLICY "Allow authenticated uploads to brand-assets"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'brand-assets');
    END IF;
END $$;

-- 3. Allow authenticated users to update (UPDATE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated updates to brand-assets'
    ) THEN
        CREATE POLICY "Allow authenticated updates to brand-assets"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'brand-assets');
    END IF;
END $$;

-- 4. Allow public read access (SELECT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read on brand-assets'
    ) THEN
        CREATE POLICY "Allow public read on brand-assets"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'brand-assets');
    END IF;
END $$;

-- 5. Allow authenticated users to delete (DELETE)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated deletes from brand-assets'
    ) THEN
        CREATE POLICY "Allow authenticated deletes from brand-assets"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'brand-assets');
    END IF;
END $$;

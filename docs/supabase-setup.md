# Supabase Storage Setup: brand-assets Bucket

This document describes the manual step to create the public storage bucket for brand assets in Supabase.

---

## Steps to Create the Bucket

1. Open **Supabase Studio** in your browser:
   👉 `http://127.0.0.1:54323` (local) or your Supabase Cloud Dashboard.

2. In the left sidebar, click on **Storage** (the bucket icon).

3. Click **New bucket** (or **Create a new bucket**).

4. Configure the bucket settings:
   - **Name**: `brand-assets`
   - **Public bucket**: **ON** (Toggle to enabled / public)
   - **File size limit**: `50 MB` (or default)
   - **Allowed MIME types**: Leave empty (or `image/png, image/jpeg, image/webp, image/svg+xml`)

5. Click **Save** / **Create bucket**.

---

## Storage Path Conventions

Files in this bucket follow strict unguessable path conventions:
- Brand logos: `brands/{brandId}/logo.{ext}`
- Generated images: `brands/{brandId}/generations/{generationId}.png`

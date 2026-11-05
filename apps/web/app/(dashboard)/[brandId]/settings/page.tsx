'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { apiClient, ApiError } from '@/lib/api';
import { Brand } from '@/types';
import { Button } from '@/components/ui/button';
import { DeleteBrandDialog } from '@/components/brand/delete-brand-dialog';

export default function BrandSettingsPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBrand = React.useCallback(async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      const data = await apiClient.get<Brand>(`/brands/${brandId}`);
      setBrand(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const updated = await apiClient.postForm<Brand>(`/brands/${brandId}/logo`, formData);
      setBrand(updated);
      setSuccess('Brand logo updated successfully!');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload logo.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!brand?.logo_url) return;

    try {
      setDeletingLogo(true);
      setError(null);
      setSuccess(null);

      const updated = await apiClient.delete<Brand>(`/brands/${brandId}/logo`);
      setBrand(updated);
      setSuccess('Brand logo removed.');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete logo.');
      }
    } finally {
      setDeletingLogo(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '300px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.5s infinite' }} />
    );
  }

  if (!brand) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Brand Settings
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Manage your brand assets, logo, and destructive actions.
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-error-subtle)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-success-subtle)',
            border: '1px solid var(--color-success)',
            color: 'var(--color-success)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {success}
        </div>
      )}

      {/* Section 1: Brand Info & Logo */}
      <div
        style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Brand Logo
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            PNG, JPEG, or WebP up to 5MB. Used for watermarking and embedding.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
          {brand.logo_url ? (
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={80}
              height={80}
              style={{
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--color-border)',
              }}
              unoptimized
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
            >
              {brand.logo_url ? 'Change Logo' : 'Upload Logo'}
            </Button>

            {brand.logo_url && (
              <Button
                variant="ghost"
                onClick={handleDeleteLogo}
                loading={deletingLogo}
                style={{ color: 'var(--color-error)' }}
              >
                Remove Logo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Danger Zone */}
      <div
        style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-error)' }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Permanently delete this brand and all related assets. This action cannot be reversed.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
            Delete Brand
          </Button>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteBrandDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        brand={brand}
      />
    </div>
  );
}

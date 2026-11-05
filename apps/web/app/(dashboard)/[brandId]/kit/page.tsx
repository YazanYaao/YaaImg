'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useKit } from '@/hooks/use-kit';
import { apiClient } from '@/lib/api';
import { Brand } from '@/types';
import { WizardContainer } from '@/components/kit-wizard/wizard-container';
import { Button } from '@/components/ui/button';

export default function BrandKitPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  const { kit, loading, saving, error, saveKit, refetch } = useKit(brandId);
  const [brand, setBrand] = useState<Brand | null>(null);

  useEffect(() => {
    if (!brandId) return;
    apiClient
      .get<Brand>(`/brands/${brandId}`)
      .then(setBrand)
      .catch(() => {});
  }, [brandId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            height: '60px',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            height: '380px',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-xl)',
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
    );
  }

  if (error && !kit) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          gap: 'var(--space-4)',
          maxWidth: '540px',
          margin: '0 auto',
        }}
      >
        <span style={{ fontSize: 'var(--font-size-2xl)' }}>⚠️</span>
        <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          Failed to load Brand Kit
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          {error}
        </p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const brandName = brand?.name || kit?.brand_name || 'My Brand';

  return (
    <WizardContainer
      brandName={brandName}
      kit={kit}
      onSave={saveKit}
      saving={saving}
    />
  );
}

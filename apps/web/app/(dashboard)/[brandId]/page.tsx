'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Brand } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProviderKeys } from '@/hooks/use-provider-keys';
import { GeneratorForm } from '@/components/generator/generator-form';

export default function BrandOverviewPage() {
  const params = useParams();
  const brandId = params?.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const { keys } = useProviderKeys(brandId);

  useEffect(() => {
    if (!brandId) return;
    apiClient.get<Brand>(`/brands/${brandId}`).then(setBrand).catch(() => {});
  }, [brandId]);

  const activeKeysCount = keys.filter((k) => k.is_active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Quick Setup Status Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Card 1: Brand Kit */}
        <div
          style={{
            padding: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Brand Kit
              </h3>
              {brand && <Badge status={brand.kit_status} />}
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Define your brand voice, tone, primary colors, and target audience to guide image generation prompts.
            </p>
          </div>

          <Link href={`/${brandId}/kit`}>
            <Button variant="secondary" size="sm">
              Configure Kit
            </Button>
          </Link>
        </div>

        {/* Card 2: Brand Logo */}
        <div
          style={{
            padding: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Brand Logo
              </h3>
              <Badge status={brand?.logo_url ? 'complete' : 'not_started'}>
                {brand?.logo_url ? 'Uploaded' : 'No Logo'}
              </Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Upload your brand logo for automatic watermarking and visual embedding in generated images.
            </p>
          </div>

          <Link href={`/${brandId}/settings`}>
            <Button variant="secondary" size="sm">
              {brand?.logo_url ? 'Change Logo' : 'Upload Logo'}
            </Button>
          </Link>
        </div>

        {/* Card 3: Provider API Keys */}
        <div
          style={{
            padding: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                API Keys
              </h3>
              <Badge status={activeKeysCount > 0 ? 'complete' : 'not_started'}>
                {activeKeysCount > 0 ? `${activeKeysCount} Active` : 'No Active Keys'}
              </Badge>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
              Configure your OpenAI and Gemini API keys for on-brand AI image generation.
            </p>
          </div>

          <Link href={`/${brandId}/keys`}>
            <Button variant="secondary" size="sm">
              Manage Keys
            </Button>
          </Link>
        </div>
      </div>

      {/* Generation Studio Workstation */}
      <React.Suspense fallback={<div style={{ padding: 'var(--space-6)', color: 'var(--color-text-muted)' }}>Loading generator...</div>}>
        <GeneratorForm
          brandId={brandId}
          brandName={brand?.name || 'Brand'}
          hasBrandLogo={Boolean(brand?.logo_url)}
          hasBrandKit={brand?.kit_status === 'complete'}
          activeKeys={keys}
        />
      </React.Suspense>
    </div>
  );
}

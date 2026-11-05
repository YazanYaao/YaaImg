'use client';

import React, { useState } from 'react';
import { useBrands } from '@/hooks/use-brands';
import { BrandCard } from '@/components/brand/brand-card';
import { CreateBrandModal } from '@/components/brand/create-brand-modal';
import { Button } from '@/components/ui/button';

export default function BrandsPage() {
  const { brands, loading, error, refetch } = useBrands();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Your Brands
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Manage your brand identities, kits, and social media image generators.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          + Create Brand
        </Button>
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

      {/* Brand Grid or Empty State */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '160px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-16) var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
            }}
          >
            ✦
          </div>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              No brands yet
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                maxWidth: '400px',
                marginTop: 'var(--space-1)',
              }}
            >
              Create your first brand identity to configure your brand kit, provider keys, and generate high-impact social images.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg" style={{ marginTop: 'var(--space-2)' }}>
            + Create First Brand
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateBrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/types';
import { Badge } from '@/components/ui/badge';

interface BrandCardProps {
  brand: Brand;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  return (
    <Link
      href={`/${brand.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-6)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
        transition: 'all var(--transition-fast)',
        minHeight: '160px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-focus)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-card-hover)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {brand.logo_url ? (
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={44}
              height={44}
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
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {brand.name}
            </h3>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Created {new Date(brand.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Badge status={brand.kit_status} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: 'var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--color-accent)',
        }}
      >
        <span>Manage Brand →</span>
      </div>
    </Link>
  );
};

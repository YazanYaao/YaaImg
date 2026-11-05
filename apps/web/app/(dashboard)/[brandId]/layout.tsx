'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { apiClient, ApiError } from '@/lib/api';
import { Brand } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function BrandScopedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const brandId = params?.brandId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrand = useCallback(async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Brand>(`/brands/${brandId}`);
      setBrand(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load brand.');
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchBrand();
  }, [fetchBrand]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '80px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '300px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16) var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Brand Not Found
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          {error || 'The brand you are looking for does not exist or you do not have permission to view it.'}
        </p>
        <Link href="/brands" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          ← Back to all brands
        </Link>
      </div>
    );
  }

  const navTabs = [
    { label: 'Overview', href: `/${brand.id}` },
    { label: 'Kit', href: `/${brand.id}/kit` },
    { label: 'Keys', href: `/${brand.id}/keys` },
    { label: 'History', href: `/${brand.id}/history` },
    { label: 'Settings', href: `/${brand.id}/settings` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Brand Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {brand.logo_url ? (
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={56}
              height={56}
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
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {brand.name}
              </h1>
              <Badge status={brand.kit_status} />
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Brand ID: {brand.id}
            </p>
          </div>
        </div>

        <Link
          href="/brands"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          All Brands ↑
        </Link>
      </div>

      {/* Brand Sub-Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        {navTabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Brand Content */}
      <div>{children}</div>
    </div>
  );
}

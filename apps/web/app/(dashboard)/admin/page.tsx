'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAdmin } from '@/hooks/use-admin';
import { AdminKpis } from '@/components/admin/admin-kpis';
import { AdminBrandsTable } from '@/components/admin/admin-brands-table';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const { stats, brands, loading, error, refresh } = useAdmin();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, []);

  const adminEmailsRaw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const allowedAdmins = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAuthorized = Boolean(userEmail && allowedAdmins.includes(userEmail.toLowerCase()));

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ height: '80px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '300px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-16) var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: 0 }}>
          You must be an authorized system operator to access the Admin Dashboard. If you believe this is an error, check the <code>ADMIN_EMAILS</code> configuration.
        </p>
        <Link href="/brands">
          <Button variant="primary">
            ← Return to Brands
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          padding: 'var(--space-6)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
              Operator Administration
            </h1>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
            Platform health, generative volume, provider distribution, and customer directory.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button variant="secondary" size="sm" onClick={() => refresh()} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger, #ef4444)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <AdminKpis stats={stats} loading={loading} />

      {/* All Brands Directory Table */}
      <AdminBrandsTable brands={brands} loading={loading} />
    </div>
  );
}

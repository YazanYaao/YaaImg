'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for client telemetry / debugging
    console.error('Unhandled dashboard runtime error:', error);
  }, [error]);

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
        gap: 'var(--space-5)',
        maxWidth: '560px',
        margin: 'var(--space-12) auto 0',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <span style={{ fontSize: '3rem' }}>💥</span>

      <div>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 1.6 }}>
          An unexpected error occurred while loading this view. You can try reloading the component or navigating back to your brands.
        </p>
      </div>

      {error.message && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger, #ef4444)',
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'monospace',
            maxWidth: '100%',
            overflowX: 'auto',
          }}
        >
          {error.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => reset()}>
          🔄 Try Again
        </Button>
        <Link href="/brands">
          <Button variant="secondary">
            ← Back to Brands
          </Button>
        </Link>
      </div>
    </div>
  );
}

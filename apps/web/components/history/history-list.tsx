'use client';

import React from 'react';
import Link from 'next/link';
import { GenerationResponse, Provider, GenerationStatus, PagedGenerationsResponse } from '@/types';
import { HistoryCard } from './history-card';
import { Button } from '@/components/ui/button';

interface HistoryListProps {
  brandId: string;
  data: PagedGenerationsResponse | null;
  loading: boolean;
  page: number;
  provider: Provider | 'all';
  status: GenerationStatus | 'all';
  onPageChange: (newPage: number) => void;
  onProviderChange: (newProvider: Provider | 'all') => void;
  onStatusChange: (newStatus: GenerationStatus | 'all') => void;
  onInspect: (generation: GenerationResponse) => void;
  onDelete: (generation: GenerationResponse) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  brandId,
  data,
  loading,
  page,
  provider,
  status,
  onPageChange,
  onProviderChange,
  onStatusChange,
  onInspect,
  onDelete,
}) => {
  const items = data?.items || [];
  const totalCount = data?.total_count || 0;
  const totalPages = data?.total_pages || 1;
  const hasActiveFilters = provider !== 'all' || status !== 'all';

  const clearFilters = () => {
    onProviderChange('all');
    onStatusChange('all');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Gallery Header & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Generation History
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '2px', margin: 0 }}>
              Browse, inspect, reuse prompts from, or download previously generated assets.
            </p>
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full, 9999px)',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              color: 'var(--color-accent, #00e5ff)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
            }}
          >
            {totalCount} {totalCount === 1 ? 'Asset' : 'Assets'}
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Provider Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Provider:
            </span>
            {(['all', 'qwen'] as const).map((p) => {
              const active = provider === p;
              const label = p === 'all' ? 'All Providers' : 'Qwen Image';
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onProviderChange(p)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: active ? 600 : 400,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--color-accent, #00e5ff)' : 'var(--color-border)'}`,
                    backgroundColor: active ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                    color: active ? 'var(--color-accent, #00e5ff)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Status:
            </span>
            {(['all', 'succeeded', 'failed'] as const).map((s) => {
              const active = status === s;
              const label = s === 'all' ? 'All Statuses' : s === 'succeeded' ? 'Succeeded' : 'Failed';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  style={{
                    padding: '4px 12px',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: active ? 600 : 400,
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${active ? 'var(--color-accent, #00e5ff)' : 'var(--color-border)'}`,
                    backgroundColor: active ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                    color: active ? 'var(--color-accent, #00e5ff)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} style={{ fontSize: 'var(--font-size-xs)', height: '28px' }}>
                ✕ Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content / Empty States / Loading */}
      {loading && items.length === 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '340px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-card)',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
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
          <div style={{ fontSize: '3rem' }}>{hasActiveFilters ? '🔍' : '🎨'}</div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            {hasActiveFilters ? 'No Matching Generations Found' : 'No Images Generated Yet'}
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: 0 }}>
            {hasActiveFilters
              ? 'Try relaxing your provider or status filter to see other generation results.'
              : 'Start by creating your first on-brand social media creative in the generator workstation.'}
          </p>

          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Link href={`/${brandId}`}>
              <Button
                variant="primary"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent, #00e5ff) 0%, #0284c7 100%)',
                  color: '#000000',
                  fontWeight: 600,
                }}
              >
                Create Your First Image →
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Gallery Responsive Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {items.map((gen) => (
              <HistoryCard
                key={gen.id}
                generation={gen}
                onInspect={onInspect}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Page <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{page}</span> of{' '}
              <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{totalPages}</span> ({totalCount} total assets)
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || loading}
              >
                ← Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

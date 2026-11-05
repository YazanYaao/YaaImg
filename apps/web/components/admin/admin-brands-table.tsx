'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminBrandItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminBrandsTableProps {
  brands: AdminBrandItem[];
  loading: boolean;
}

export const AdminBrandsTable: React.FC<AdminBrandsTableProps> = ({ brands, loading }) => {
  const [search, setSearch] = useState('');

  const filteredBrands = useMemo(() => {
    if (!search.trim()) return brands;
    const term = search.trim().toLowerCase();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.owner_user_id.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term)
    );
  }, [brands, search]);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-5)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            All Brands Directory
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
            System-wide overview of all customer workspaces, setups, and generation volumes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input
            type="text"
            placeholder="Search by brand or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: '36px',
              padding: '0 var(--space-3)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              outline: 'none',
              minWidth: '240px',
            }}
          />
          {search && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading && brands.length === 0 ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading brands directory...
        </div>
      ) : filteredBrands.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-12) var(--space-4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ fontSize: '2rem' }}>🔍</div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No matching brands found</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {search ? 'Try modifying your search criteria.' : 'No brands have been created on the platform yet.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Brand</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Owner ID</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Kit Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Active Keys</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Generations</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Created</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((b) => (
                <tr
                  key={b.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="hover:bg-[var(--color-bg-subtle,#0d121f)]"
                >
                  {/* Brand & Logo */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {b.logo_url ? (
                        <Image
                          src={b.logo_url}
                          alt={b.name}
                          width={32}
                          height={32}
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: '1px solid var(--color-border)',
                          }}
                          unoptimized
                        />
                      ) : (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(135deg, var(--color-accent) 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 700,
                          }}
                        >
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{b.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          {b.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Owner ID */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                      }}
                      title={b.owner_user_id}
                    >
                      {b.owner_user_id.slice(0, 8)}...{b.owner_user_id.slice(-4)}
                    </span>
                  </td>

                  {/* Kit Status */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Badge
                      status={
                        b.kit_status === 'complete'
                          ? 'complete'
                          : b.kit_status === 'in_progress' || b.kit_status === 'draft'
                          ? 'in_progress'
                          : 'not_started'
                      }
                    >
                      {b.kit_status === 'complete'
                        ? 'Complete'
                        : b.kit_status === 'in_progress' || b.kit_status === 'draft'
                        ? 'In Progress'
                        : 'Not Started'}
                    </Badge>
                  </td>

                  {/* Active Keys */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: b.active_keys_count > 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      }}
                    >
                      {b.active_keys_count} Active
                    </span>
                  </td>

                  {/* Generations */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {b.total_generations}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                      ({b.succeeded_generations} ok)
                    </span>
                  </td>

                  {/* Created */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link href={`/${b.id}`}>
                      <Button variant="secondary" size="sm">
                        View Brand →
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

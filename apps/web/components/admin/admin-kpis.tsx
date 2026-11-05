'use client';

import React from 'react';
import { AdminStatsResponse } from '@/types';

interface AdminKpisProps {
  stats: AdminStatsResponse | null;
  loading: boolean;
}

export const AdminKpis: React.FC<AdminKpisProps> = ({ stats, loading }) => {
  if (loading && !stats) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '130px',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-lg)',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  const s = stats || {
    total_brands: 0,
    total_users: 0,
    total_generations: 0,
    succeeded_generations: 0,
    failed_generations: 0,
    openai_generations: 0,
    gemini_generations: 0,
    qwen_generations: 0,
    active_openai_keys: 0,
    active_gemini_keys: 0,
    active_qwen_keys: 0,
    success_rate: 0,
  };

  const qwenGens = s.qwen_generations || 0;
  const qwenKeys = s.active_qwen_keys || 0;

  const cards = [
    {
      title: 'Brands & Community',
      icon: '🏢',
      primaryValue: s.total_brands,
      primaryLabel: 'Total Brands',
      subValue: `${s.total_users} Brand Owners`,
      badgeColor: 'var(--color-accent, #00e5ff)',
    },
    {
      title: 'Generative Volume',
      icon: '⚡',
      primaryValue: s.total_generations,
      primaryLabel: 'Total Generations',
      subValue: `${s.success_rate}% Success (${s.succeeded_generations} ok / ${s.failed_generations} failed)`,
      badgeColor: '#10b981',
    },
    {
      title: 'Qwen Engine Adoption',
      icon: '⚡',
      primaryValue: qwenGens,
      primaryLabel: 'Qwen Image 2.1 Generations',
      subValue:
        s.openai_generations > 0 || s.gemini_generations > 0
          ? `Qwen: ${qwenGens} | Legacy: ${s.openai_generations + s.gemini_generations}`
          : 'Active Engine: Qwen 2.1 Turbo & Pro',
      badgeColor: '#8b5cf6',
    },
    {
      title: 'Active Qwen BYOK Keys',
      icon: '🔑',
      primaryValue: qwenKeys,
      primaryLabel: 'Configured Qwen Keys',
      subValue:
        s.active_openai_keys > 0 || s.active_gemini_keys > 0
          ? `Qwen: ${qwenKeys} active | Legacy keys: ${s.active_openai_keys + s.active_gemini_keys}`
          : 'Alibaba Cloud DashScope keys configured',
      badgeColor: '#f59e0b',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {card.title}
            </span>
            <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {card.primaryValue}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {card.primaryLabel}
            </div>
          </div>

          <div
            style={{
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            {card.subValue}
          </div>
        </div>
      ))}
    </div>
  );
};

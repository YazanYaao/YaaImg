'use client';

import React from 'react';
import Link from 'next/link';
import { LogoMode } from '@/types';

interface LogoModeSelectorProps {
  logoMode: LogoMode;
  onLogoModeChange: (m: LogoMode) => void;
  hasBrandLogo: boolean;
  brandId: string;
}

const MODES: { id: LogoMode; title: string; desc: string; icon: string; requiresLogo: boolean }[] = [
  { id: 'none', title: 'No Logo', desc: 'Generate pure unbranded imagery', icon: '🚫', requiresLogo: false },
  { id: 'prompt', title: 'Scene Embedding', desc: 'Prompt AI to render logo inside the scene', icon: '🎨', requiresLogo: true },
  { id: 'watermark', title: 'Corner Watermark', desc: 'Overlay clean logo on bottom-right corner', icon: '📌', requiresLogo: true },
  { id: 'both', title: 'Scene + Watermark', desc: 'Both AI scene embedding & corner watermark', icon: '✨', requiresLogo: true },
];

export const LogoModeSelector: React.FC<LogoModeSelectorProps> = ({
  logoMode,
  onLogoModeChange,
  hasBrandLogo,
  brandId,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Brand Logo Inclusion
        </label>

        {!hasBrandLogo && (
          <Link
            href={`/${brandId}/settings`}
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
            }}
          >
            Upload logo in Settings →
          </Link>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {MODES.map((m) => {
          const isSelected = logoMode === m.id;
          const isDisabled = m.requiresLogo && !hasBrandLogo;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (!isDisabled) {
                  onLogoModeChange(m.id);
                }
              }}
              disabled={isDisabled}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                textAlign: 'left',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--font-size-base)' }}>{m.icon}</span>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {m.title}
                </span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                {m.desc}
              </span>
              {isDisabled && (
                <span style={{ fontSize: '10px', color: 'var(--color-warning)', marginTop: 'var(--space-1)' }}>
                  No logo uploaded
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { Provider } from '@/types';

interface ProviderSelectorProps {
  provider?: Provider;
  onProviderChange?: (p: Provider) => void;
  model: string;
  onModelChange: (m: string) => void;
  hasActiveKey: boolean;
  brandId: string;
}

interface ModelOption {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
}

const QWEN_MODELS: ModelOption[] = [
  {
    id: 'qwen-image-2.1-turbo',
    name: 'Qwen Turbo',
    badge: 'Default • Fast',
    icon: '⚡',
    description: 'Rapid 8-step distilled generation. Ideal for daily social media posts and iterations.',
  },
  {
    id: 'qwen-image-2.1-pro',
    name: 'Qwen Pro',
    badge: 'Ultra Quality',
    icon: '💎',
    description: 'Premium photorealism, fine details, and state-of-the-art text typography rendering.',
  },
];

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  model,
  onModelChange,
  hasActiveKey,
  brandId,
}) => {
  const selectedModelId = model || 'qwen-image-2.1-turbo';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Header: Label & Active Key Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-base)' }}>🔮</span>
          <label
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            AI Model (Qwen Image 2.1)
          </label>
        </div>

        {hasActiveKey ? (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <span>✓</span>
            <span>Active Qwen Key Ready</span>
          </span>
        ) : (
          <Link
            href={`/${brandId}/keys`}
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-warning)',
              textDecoration: 'underline',
              fontWeight: 500,
            }}
          >
            ⚠️ Configure Qwen API Key →
          </Link>
        )}
      </div>

      {/* Side-by-Side Qwen Model Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {QWEN_MODELS.map((option) => {
          const isSelected = selectedModelId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onModelChange(option.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-4)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                transition: 'all var(--transition-fast)',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-lg)' }}>{option.icon}</span>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {option.name}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full, 9999px)',
                      backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-bg-input)',
                      color: isSelected ? '#000000' : 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {option.badge}
                  </span>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: 'var(--radius-full)',
                      border: isSelected ? '5px solid var(--color-accent)' : '2px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-bg-canvas)' : 'transparent',
                    }}
                  />
                </div>
              </div>

              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

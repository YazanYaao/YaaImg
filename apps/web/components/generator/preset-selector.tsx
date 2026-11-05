'use client';

import React, { useState } from 'react';
import { PlatformPreset } from '@/types';
import { PLATFORM_TABS, PRESETS, SocialPlatform, getPresetsByPlatform } from '@/lib/presets';

interface PresetSelectorProps {
  selectedPreset: PlatformPreset;
  onSelect: (preset: PlatformPreset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPreset,
  onSelect,
}) => {
  const currentPresetMeta = PRESETS[selectedPreset];
  const [activePlatform, setActivePlatform] = useState<SocialPlatform>(
    currentPresetMeta ? currentPresetMeta.platform : 'instagram'
  );

  const presetsForPlatform = getPresetsByPlatform(activePlatform);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <label
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Target Social Platform & Format
      </label>

      {/* Platform Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-1)',
        }}
      >
        {PLATFORM_TABS.map((tab) => {
          const isTabActive = activePlatform === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePlatform(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: isTabActive ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                border: isTabActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: isTabActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: isTabActive ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Presets Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {presetsForPlatform.map((p) => {
          const isSelected = selectedPreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onSelect(p.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {p.label}
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg-input)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {p.aspectRatio}
                </span>
              </div>

              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontFamily: 'monospace',
                }}
              >
                {p.width} × {p.height} px
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

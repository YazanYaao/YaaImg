'use client';

import React from 'react';
import { GenerationResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { getPresetMeta } from '@/lib/presets';

interface ResultPreviewProps {
  result: GenerationResponse;
  onClear: () => void;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({ result, onClear }) => {
  const preset = getPresetMeta(result.platform_preset);

  const handleDownload = async () => {
    if (!result.image_url) return;

    try {
      const response = await fetch(result.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yaaimg-${result.platform_preset}-${result.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(result.image_url, '_blank');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--color-success)',
              color: 'var(--color-success)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
            }}
          >
            ✓ Generated Successfully
          </span>

          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'monospace',
            }}
          >
            {preset.label} ({result.width} × {result.height} px)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="primary" size="sm" onClick={handleDownload}>
            ⬇️ Download PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={onClear}>
            ✕ Close
          </Button>
        </div>
      </div>

      {/* Main Image View */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0d14',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          maxHeight: '600px',
        }}
      >
        {result.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.image_url}
            alt={result.prompt}
            style={{
              maxWidth: '100%',
              maxHeight: '600px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <div style={{ padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
            No image URL available
          </div>
        )}
      </div>

      {/* Footer details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          <span>Engine: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.provider.toUpperCase()} ({result.model})</strong></span>
          <span>•</span>
          <span>Logo: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.logo_mode}</strong></span>
        </div>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
          &ldquo;{result.prompt}&rdquo;
        </p>
      </div>
    </div>
  );
};

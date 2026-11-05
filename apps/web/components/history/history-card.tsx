'use client';

import React from 'react';
import Image from 'next/image';
import { GenerationResponse } from '@/types';
import { getPresetMeta } from '@/lib/presets';

interface HistoryCardProps {
  generation: GenerationResponse;
  onInspect: (generation: GenerationResponse) => void;
  onDelete: (generation: GenerationResponse) => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  generation,
  onInspect,
  onDelete,
}) => {
  const meta = getPresetMeta(generation.platform_preset);
  const isFailed = generation.status === 'failed';
  const hasImage = Boolean(generation.image_url);

  const formattedDate = new Date(generation.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!generation.image_url) return;

    const link = document.createElement('a');
    link.href = generation.image_url;
    link.download = `yaaimg-${generation.platform_preset}-${generation.id.slice(0, 8)}.png`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(generation);
  };

  return (
    <div
      onClick={() => onInspect(generation)}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      className="group hover:border-[var(--color-accent)] hover:shadow-md"
    >
      {/* Uniform Square Thumbnail Container */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          backgroundColor: '#070a13',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {hasImage && generation.image_url ? (
          <Image
            src={generation.image_url}
            alt={generation.prompt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        ) : isFailed ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-4)',
              textAlign: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-danger, #ef4444)',
            }}
          >
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Generation Failed</span>
            {generation.error_code && (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {generation.error_code}
              </span>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Processing...
          </div>
        )}

        {/* Floating Quick Action Overlay on Hover */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-2)',
            right: 'var(--space-2)',
            display: 'flex',
            gap: 'var(--space-1)',
            opacity: 0.9,
          }}
        >
          {hasImage && (
            <button
              onClick={handleDownload}
              title="Download PNG"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              📥
            </button>
          )}
          <button
            onClick={handleDelete}
            title="Delete generation"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.85)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Card Info & Badges */}
      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                color: 'var(--color-accent, #00e5ff)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
              }}
            >
              {meta.label} ({meta.width}×{meta.height})
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-bg-subtle, #1e293b)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {generation.provider.toUpperCase()}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {formattedDate}
          </span>
        </div>

        {/* Truncated Prompt Snippet */}
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: 0,
          }}
          title={generation.prompt}
        >
          {generation.prompt}
        </p>

        {isFailed && generation.error_message && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-danger, #ef4444)',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
            }}
          >
            {generation.error_message}
          </p>
        )}
      </div>
    </div>
  );
};

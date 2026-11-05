'use client';

import React from 'react';
import { KitResponse, Tone } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KitSummaryProps {
  kit: KitResponse;
  onEdit: () => void;
}

const TONE_INFO: Record<Tone, { name: string; description: string; emoji: string }> = {
  professional: { name: 'Professional', description: 'Expert, authoritative, and credible', emoji: '💼' },
  friendly: { name: 'Friendly', description: 'Warm, welcoming, and approachable', emoji: '🤝' },
  casual: { name: 'Casual', description: 'Relaxed, conversational, and direct', emoji: '☕' },
  playful: { name: 'Playful', description: 'Fun, lighthearted, and expressive', emoji: '✨' },
  formal: { name: 'Formal', description: 'Serious, structured, and business-focused', emoji: '🏛️' },
};

export const KitSummary: React.FC<KitSummaryProps> = ({ kit, onEdit }) => {
  const { answers, status, completed_at, updated_at, brand_name } = kit;
  const toneData = answers.tone ? TONE_INFO[answers.tone] : null;

  const formattedDate = completed_at
    ? new Date(completed_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : updated_at
    ? new Date(updated_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
            }}
          >
            🎨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {brand_name || 'Brand Kit'}
              </h2>
              <Badge status={status}>{status === 'complete' ? 'Complete' : 'In Progress'}</Badge>
            </div>
            {formattedDate && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 'var(--space-1) 0 0 0' }}>
                Completed on {formattedDate}
              </p>
            )}
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={onEdit}>
          ✏️ Edit Brand Kit
        </Button>
      </div>

      {/* Grid of answers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Tagline / Slogan
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: answers.tagline ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontStyle: answers.tagline ? 'normal' : 'italic',
              margin: 0,
            }}
          >
            {answers.tagline || 'None specified'}
          </p>
        </div>

        {/* Tone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Tone of Voice
          </span>
          {toneData ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-size-lg)' }}>{toneData.emoji}</span>
              <div>
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {toneData.name}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginLeft: 'var(--space-2)' }}>
                  ({toneData.description})
                </span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
              None specified
            </p>
          )}
        </div>

        {/* Target Audience */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Target Audience
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: answers.audience ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              lineHeight: 'var(--line-height-relaxed)',
              margin: 0,
            }}
          >
            {answers.audience || 'None specified'}
          </p>
        </div>

        {/* Brand Colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Brand Colors
          </span>
          {answers.colors && answers.colors.length > 0 ? (
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {answers.colors.map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-1) var(--space-3)',
                    backgroundColor: 'var(--color-bg-input)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: c,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {c}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
              None specified
            </p>
          )}
        </div>

        {/* Avoid Words */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Avoid Words & Themes
          </span>
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: answers.avoid_words ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              fontStyle: answers.avoid_words ? 'normal' : 'italic',
              margin: 0,
            }}
          >
            {answers.avoid_words || 'None specified'}
          </p>
        </div>
      </div>
    </div>
  );
};

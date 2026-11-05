'use client';

import React from 'react';
import { Tone } from '@/types';

interface StepToneProps {
  value: Tone | null;
  onChange: (value: Tone) => void;
}

const TONES: { id: Tone; name: string; description: string; emoji: string }[] = [
  { id: 'professional', name: 'Professional', description: 'Expert, authoritative, and credible', emoji: '💼' },
  { id: 'friendly', name: 'Friendly', description: 'Warm, welcoming, and approachable', emoji: '🤝' },
  { id: 'casual', name: 'Casual', description: 'Relaxed, conversational, and direct', emoji: '☕' },
  { id: 'playful', name: 'Playful', description: 'Fun, lighthearted, and expressive', emoji: '✨' },
  { id: 'formal', name: 'Formal', description: 'Serious, structured, and business-focused', emoji: '🏛️' },
];

export const StepTone: React.FC<StepToneProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Tone of Voice
          </h3>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent-subtle)',
              border: '1px solid var(--color-accent)',
              color: 'var(--color-accent)',
            }}
          >
            Required
          </span>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Choose the tone that best reflects how your brand communicates with its audience.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {TONES.map((t) => {
          const isSelected = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: 'var(--space-4)',
                backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
                border: isSelected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--font-size-2xl)' }}>{t.emoji}</span>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '5px solid var(--color-accent)' : '2px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-bg-canvas)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              </div>
              <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {t.name}
              </span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                {t.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React from 'react';

interface StepTaglineProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const StepTagline: React.FC<StepTaglineProps> = ({ value, onChange }) => {
  const text = value || '';
  const maxLength = 160;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val === '' ? null : val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Tagline or Slogan
          </h3>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            Optional
          </span>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          A short, memorable phrase that captures the essence of your brand.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <input
          type="text"
          maxLength={maxLength}
          value={text}
          onChange={handleChange}
          placeholder="e.g., Innovation for everyone"
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-input)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: text.length >= maxLength ? 'var(--color-danger)' : 'var(--color-text-muted)',
            }}
          >
            {text.length}/{maxLength}
          </span>
        </div>
      </div>
    </div>
  );
};

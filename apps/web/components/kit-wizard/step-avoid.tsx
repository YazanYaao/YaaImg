'use client';

import React from 'react';

interface StepAvoidProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const StepAvoid: React.FC<StepAvoidProps> = ({ value, onChange }) => {
  const text = value || '';

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val === '' ? null : val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Words or Themes to Avoid
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
          Specify negative concepts, keywords, or visual elements you do not want in your generated images.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <textarea
          rows={4}
          value={text}
          onChange={handleChange}
          placeholder="e.g., cheap, discount, cartoon, clip art, low resolution, crowded, blurry"
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-input)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-normal)',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
          Separate words or phrases with commas. These will be added as negative constraints in image generation.
        </p>
      </div>
    </div>
  );
};

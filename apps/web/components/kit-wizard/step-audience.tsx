'use client';

import React from 'react';

interface StepAudienceProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export const StepAudience: React.FC<StepAudienceProps> = ({ value, onChange }) => {
  const text = value || '';
  const maxLength = 500;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val === '' ? null : val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Target Audience
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
          Describe who you are creating images for — demographics, professions, interests, or industry.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <textarea
          rows={5}
          maxLength={maxLength}
          value={text}
          onChange={handleChange}
          placeholder="e.g., Small business owners and freelance creators aged 25-45 looking for sleek, modern visuals to elevate their social media presence."
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            Min 2 characters
          </span>
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

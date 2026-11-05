'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface StepColorsProps {
  value: string[];
  onChange: (colors: string[]) => void;
}

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const StepColors: React.FC<StepColorsProps> = ({ value, onChange }) => {
  const [currentColor, setCurrentColor] = useState<string>('#3B82F6');
  const [hexInput, setHexInput] = useState<string>('#3B82F6');
  const [error, setError] = useState<string | null>(null);

  const colors = value || [];
  const maxColors = 3;

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCurrentColor(val);
    setHexInput(val);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    setHexInput(val);
    if (HEX_REGEX.test(val)) {
      setCurrentColor(val);
      setError(null);
    }
  };

  const handleAddColor = () => {
    if (colors.length >= maxColors) {
      setError('You can add up to 3 brand colors.');
      return;
    }

    const formatted = hexInput.trim().toUpperCase();
    if (!HEX_REGEX.test(formatted)) {
      setError('Please enter a valid 6-character hex color (e.g. #3B82F6).');
      return;
    }

    if (colors.includes(formatted)) {
      setError('This color is already in your palette.');
      return;
    }

    onChange([...colors, formatted]);
    setError(null);
  };

  const handleRemoveColor = (indexToRemove: number) => {
    onChange(colors.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Brand Colors
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
            Required (1-3)
          </span>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Pick 1 to 3 primary colors that will establish the visual style of your AI generated images.
        </p>
      </div>

      {/* Input controls: Picker + Hex Input + Add Button */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="color"
            value={currentColor}
            onChange={handlePickerChange}
            disabled={colors.length >= maxColors}
            style={{
              width: '42px',
              height: '42px',
              padding: 0,
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              cursor: colors.length >= maxColors ? 'not-allowed' : 'pointer',
            }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={handleTextChange}
            maxLength={7}
            placeholder="#3B82F6"
            disabled={colors.length >= maxColors}
            style={{
              width: '110px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              textTransform: 'uppercase',
              outline: 'none',
            }}
          />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddColor}
          disabled={colors.length >= maxColors}
        >
          + Add to Palette
        </Button>

        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {colors.length}/{maxColors} colors added
        </span>
      </div>

      {error && (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
          {error}
        </span>
      )}

      {/* Swatches List */}
      <div>
        <label style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          Selected Palette
        </label>
        {colors.length === 0 ? (
          <div
            style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-4)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            No colors added yet. Please choose at least 1 color.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            {colors.map((c, idx) => (
              <div
                key={`${c}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: c,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {c}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(idx)}
                  title="Remove color"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-base)',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

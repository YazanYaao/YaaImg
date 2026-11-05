'use client';

import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedFields: Record<number, boolean>;
}

const STEPS = [
  { step: 1, label: 'Name' },
  { step: 2, label: 'Tagline' },
  { step: 3, label: 'Tone' },
  { step: 4, label: 'Audience' },
  { step: 5, label: 'Colors' },
  { step: 6, label: 'Avoid' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  completedFields,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 'var(--space-4) var(--space-2)',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        overflowX: 'auto',
      }}
    >
      {STEPS.map((s, idx) => {
        const isActive = currentStep === s.step;
        const isCompleted = completedFields[s.step];
        const isLast = idx === STEPS.length - 1;

        return (
          <React.Fragment key={s.step}>
            <button
              type="button"
              onClick={() => onStepClick(s.step)}
              title={`Go to Step ${s.step}: ${s.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                transition: 'all var(--transition-fast)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  transition: 'all var(--transition-fast)',
                  backgroundColor: isActive
                    ? 'var(--color-accent)'
                    : isCompleted
                    ? 'var(--color-accent-subtle)'
                    : 'var(--color-bg-input)',
                  color: isActive
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--color-accent)'
                    : 'var(--color-text-muted)',
                  border: isActive
                    ? '2px solid var(--color-accent)'
                    : isCompleted
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                }}
              >
                {isCompleted && !isActive ? '✓' : s.step}
              </div>

              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? 'var(--color-accent)'
                    : isCompleted
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </span>
            </button>

            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  minWidth: '16px',
                  backgroundColor: isCompleted
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                  margin: '0 var(--space-1)',
                  transition: 'background-color var(--transition-fast)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

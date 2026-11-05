'use client';

import React from 'react';
import { KitStatus } from '@/types';

export interface BadgeProps {
  status?: KitStatus | 'success' | 'warning' | 'error' | 'info' | 'default';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'default', children }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'complete':
      case 'success':
        return {
          bg: 'var(--color-success-subtle)',
          color: 'var(--color-success)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          label: children || 'Complete',
        };
      case 'in_progress':
      case 'warning':
        return {
          bg: 'var(--color-warning-subtle)',
          color: 'var(--color-warning)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          label: children || 'In Progress',
        };
      case 'not_started':
      case 'default':
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          color: 'var(--color-text-muted)',
          border: '1px solid rgba(100, 116, 139, 0.3)',
          label: children || 'Not Started',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        padding: '2px 8px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        backgroundColor: config.bg,
        color: config.color,
        border: config.border,
        textTransform: 'capitalize',
        letterSpacing: 'var(--letter-spacing-wide)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {config.label}
    </span>
  );
};

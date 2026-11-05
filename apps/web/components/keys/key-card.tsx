'use client';

import React, { useState } from 'react';
import { ProviderKey } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface KeyCardProps {
  providerKey: ProviderKey;
  onValidate: (keyId: string) => Promise<void>;
  onActivate: (keyId: string) => Promise<void>;
  onDelete: (keyId: string) => Promise<void>;
}

export const KeyCard: React.FC<KeyCardProps> = ({
  providerKey,
  onValidate,
  onActivate,
  onDelete,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      await onValidate(providerKey.id);
    } finally {
      setIsValidating(false);
    }
  };

  const handleActivate = async () => {
    try {
      setIsActivating(true);
      await onActivate(providerKey.id);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this provider key?')) {
      try {
        setIsDeleting(true);
        await onDelete(providerKey.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatValidationTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Validated just now';
    if (diffMins < 60) return `Validated ${diffMins}m ago`;
    if (diffHours < 24) return `Validated ${diffHours}h ago`;
    return `Validated ${diffDays}d ago`;
  };

  type FlexibleKey = ProviderKey & {
    isActive?: boolean;
    keyHint?: string;
    isValid?: boolean | null;
    lastValidatedAt?: string | null;
    lastValidationError?: string | null;
  };
  const rawKey = providerKey as FlexibleKey;
  const isActive = providerKey.is_active ?? rawKey.isActive ?? false;
  const keyHint = providerKey.key_hint ?? rawKey.keyHint ?? '***';
  const isValid = providerKey.is_valid ?? rawKey.isValid ?? null;
  const lastValidatedAt = providerKey.last_validated_at ?? rawKey.lastValidatedAt ?? null;
  const lastValidationError = providerKey.last_validation_error ?? rawKey.lastValidationError ?? null;

  return (
    <div
      style={{
        padding: 'var(--space-5)',
        backgroundColor: 'var(--color-bg-card)',
        border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div>
        {/* Header: Label & Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-base)' }}>
              {providerKey.provider === 'openai' ? '⚡' : providerKey.provider === 'gemini' ? '✨' : '🔮'}
            </span>
            <h4
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {providerKey.label || 'Untitled Key'}
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {isActive ? (
              <Badge status="success">Active</Badge>
            ) : (
              <Badge status="not_started">Inactive</Badge>
            )}
          </div>
        </div>

        {/* Key Hint */}
        <div style={{ marginTop: 'var(--space-3)' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-input)',
              padding: 'var(--space-1) var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              letterSpacing: '1px',
            }}
          >
            {keyHint}
          </span>
        </div>

        {/* Persistent Validation Status Indicator */}
        <div
          style={{
            marginTop: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          {isValid === true && (
            <>
              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span>
              <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>Valid</span>
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {formatValidationTime(lastValidatedAt)}
              </span>
            </>
          )}

          {isValid === false && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <span style={{ color: 'var(--color-error)', fontWeight: 700 }}>✗</span>
                <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>Invalid</span>
                {lastValidatedAt && (
                  <>
                    <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      {formatValidationTime(lastValidatedAt)}
                    </span>
                  </>
                )}
              </div>
              {lastValidationError && (
                <span style={{ color: 'var(--color-error)', fontSize: '11px', maxWidth: '340px' }}>
                  {lastValidationError}
                </span>
              )}
            </div>
          )}

          {(isValid === null || isValid === undefined) && (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>?</span>
              <span style={{ color: 'var(--color-text-muted)' }}>Not yet validated</span>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-1)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleValidate}
            loading={isValidating}
            disabled={isValidating || isActivating || isDeleting}
          >
            Validate
          </Button>

          {!isActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleActivate}
              loading={isActivating}
              disabled={isValidating || isActivating || isDeleting}
            >
              Set as Active
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          loading={isDeleting}
          disabled={isValidating || isActivating || isDeleting}
          style={{ color: 'var(--color-error)' }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

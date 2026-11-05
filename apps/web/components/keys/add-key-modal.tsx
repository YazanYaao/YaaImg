'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Provider, AddKeyRequest, ProviderKey } from '@/types';
import { ApiError } from '@/lib/api';

interface AddKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: Provider;
  onAddKey: (request: AddKeyRequest) => Promise<ProviderKey>;
}

export const AddKeyModal: React.FC<AddKeyModalProps> = ({
  isOpen,
  onClose,
  defaultProvider = 'qwen',
  onAddKey,
}) => {
  const provider: Provider = defaultProvider || 'qwen';
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [makeActive, setMakeActive] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setKey('');
    setLabel('');
    setMakeActive(true);
    setShowKey(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      setError('DashScope API key is required.');
      return;
    }

    if (label.trim().length > 100) {
      setError('Label cannot exceed 100 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onAddKey({
        provider,
        key: trimmedKey,
        label: label.trim() || undefined,
        make_active: makeActive,
      });

      handleClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add provider key.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Qwen API Key" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Your key will be securely encrypted in Supabase Vault and never exposed.
        </p>

        {error && (
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-error-subtle)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {error}
          </div>
        )}

        {/* Provider Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-accent-subtle)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: 'var(--font-size-xl)' }}>🔮</span>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Alibaba Cloud Model Studio (DashScope)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Powers Qwen Image 2.1 Turbo & Pro generations.
            </div>
          </div>
        </div>

        {/* API Key Input with Eye Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            API Key
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-... (from DashScope / Model Studio console)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-10) var(--space-2) var(--space-3)',
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontSize: 'var(--font-size-sm)',
                fontFamily: showKey ? 'var(--font-sans)' : 'var(--font-mono)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: 'var(--space-2)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                padding: 'var(--space-1)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Get your key from Alibaba Cloud Model Studio Console (DashScope).
          </span>
        </div>

        {/* Key Label Input */}
        <Input
          label="Label (Optional)"
          placeholder="e.g., Production DashScope Key"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={100}
          helperText="A friendly nickname to identify this key."
        />

        {/* Make Active Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="checkbox"
            id="makeActive"
            checked={makeActive}
            onChange={(e) => setMakeActive(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              accentColor: 'var(--color-accent)',
              cursor: 'pointer',
            }}
          />
          <label
            htmlFor="makeActive"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            Set as active key for Qwen generations
          </label>
        </div>

        {/* Form Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-4)',
          }}
        >
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save & Encrypt Key
          </Button>
        </div>
      </form>
    </Modal>
  );
};

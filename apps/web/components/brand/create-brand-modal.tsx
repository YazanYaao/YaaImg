'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/api';
import { Brand } from '@/types';

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBrand: Brand) => void;
}

export const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setError('Brand name must be between 2 and 120 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const created = await apiClient.post<Brand>('/brands', { name: trimmedName });

      setName('');
      onClose();

      if (onSuccess) {
        onSuccess(created);
      } else {
        router.push(`/${created.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create brand.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Brand">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Enter a unique name for your brand. You will be able to customize colors, tone, and upload a logo later.
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

        <Input
          label="Brand name"
          placeholder="e.g. Acme Corp, TechVibe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          minLength={2}
          maxLength={120}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Brand
          </Button>
        </div>
      </form>
    </Modal>
  );
};

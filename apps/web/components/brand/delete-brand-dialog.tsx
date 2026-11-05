'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, ApiError } from '@/lib/api';
import { Brand } from '@/types';

interface DeleteBrandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
}

export const DeleteBrandDialog: React.FC<DeleteBrandDialogProps> = ({
  isOpen,
  onClose,
  brand,
}) => {
  const router = useRouter();
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatch = confirmName === brand.name;

  const handleDelete = async () => {
    if (!isMatch) return;

    try {
      setLoading(true);
      setError(null);

      await apiClient.delete(`/brands/${brand.id}`);

      onClose();
      router.push('/brands');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete brand.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmName('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Brand Permanently">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-error-subtle)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          <strong>⚠️ Warning:</strong> This action cannot be undone. This will permanently delete the brand{' '}
          <strong>&quot;{brand.name}&quot;</strong>, all stored logos, all generated images, and associated brand kits.
        </div>

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

        <div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>
            To confirm deletion, type <strong style={{ color: 'var(--color-text-primary)' }}>{brand.name}</strong> below:
          </p>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={brand.name}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={!isMatch || loading}
            loading={loading}
          >
            Delete Brand
          </Button>
        </div>
      </div>
    </Modal>
  );
};

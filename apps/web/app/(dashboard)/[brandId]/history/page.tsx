'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { GenerationResponse } from '@/types';
import { useGenerations } from '@/hooks/use-generations';
import { HistoryList } from '@/components/history/history-list';
import { ImageModal } from '@/components/history/image-modal';
import { DeleteModal } from '@/components/history/delete-modal';

export default function BrandHistoryPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  const {
    data,
    loading,
    error,
    page,
    provider,
    status,
    deletingId,
    setPage,
    setProvider,
    setStatus,
    deleteGeneration,
  } = useGenerations(brandId, 12);

  const [inspectingGeneration, setInspectingGeneration] = useState<GenerationResponse | null>(null);
  const [deletingGeneration, setDeletingGeneration] = useState<GenerationResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingGeneration) return;
    try {
      setDeleteError(null);
      await deleteGeneration(deletingGeneration.id);
      setDeletingGeneration(null);
      if (inspectingGeneration?.id === deletingGeneration.id) {
        setInspectingGeneration(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete generation.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger, #ef4444)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {error}
        </div>
      )}

      {deleteError && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger, #ef4444)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger, #ef4444)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {deleteError}
        </div>
      )}

      <HistoryList
        brandId={brandId}
        data={data}
        loading={loading}
        page={page}
        provider={provider}
        status={status}
        onPageChange={setPage}
        onProviderChange={setProvider}
        onStatusChange={setStatus}
        onInspect={setInspectingGeneration}
        onDelete={setDeletingGeneration}
      />

      <ImageModal
        generation={inspectingGeneration}
        brandId={brandId}
        isOpen={Boolean(inspectingGeneration)}
        onClose={() => setInspectingGeneration(null)}
        onDelete={setDeletingGeneration}
      />

      <DeleteModal
        isOpen={Boolean(deletingGeneration)}
        isDeleting={Boolean(deletingId)}
        onClose={() => {
          setDeletingGeneration(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

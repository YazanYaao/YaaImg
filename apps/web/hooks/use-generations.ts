'use client';

import { useState, useEffect, useCallback } from 'react';
import { PagedGenerationsResponse, Provider, GenerationStatus } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useGenerations(brandId: string, initialPerPage: number = 12) {
  const [data, setData] = useState<PagedGenerationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [provider, setProviderState] = useState<Provider | 'all'>('all');
  const [status, setStatusState] = useState<GenerationStatus | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGenerations = useCallback(async () => {
    if (!brandId) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('perPage', initialPerPage.toString());

      if (provider !== 'all') {
        params.append('provider', provider);
      }

      if (status !== 'all') {
        params.append('status', status);
      }

      const result = await apiClient.get<PagedGenerationsResponse>(
        `/brands/${brandId}/generations?${params.toString()}`
      );
      setData(result);
    } catch (err: unknown) {
      let message = 'Failed to load generations.';
      if (err instanceof ApiError) {
        message = err.data.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [brandId, page, initialPerPage, provider, status]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const setProvider = (newProvider: Provider | 'all') => {
    setProviderState(newProvider);
    setPage(1);
  };

  const setStatus = (newStatus: GenerationStatus | 'all') => {
    setStatusState(newStatus);
    setPage(1);
  };

  const deleteGeneration = async (generationId: string): Promise<boolean> => {
    try {
      setDeletingId(generationId);
      await apiClient.delete(`/brands/${brandId}/generations/${generationId}`);

      // Optimistically update or re-fetch
      setData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.filter((item) => item.id !== generationId);
        return {
          ...prev,
          items: updatedItems,
          total_count: Math.max(0, prev.total_count - 1),
        };
      });

      // Refetch to sync pagination bounds
      await fetchGenerations();
      return true;
    } catch (err: unknown) {
      let message = 'Failed to delete generation.';
      if (err instanceof ApiError) {
        message = err.data.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      throw new Error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return {
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
    refresh: fetchGenerations,
  };
}

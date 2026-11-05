'use client';

import { useState, useEffect, useCallback } from 'react';
import { KitResponse, KitAnswers } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useKit(brandId: string) {
  const [kit, setKit] = useState<KitResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKit = useCallback(async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<KitResponse>(`/brands/${brandId}/kit`);
      setKit(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch brand kit.');
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchKit();
  }, [fetchKit]);

  const saveKit = async (answers: KitAnswers): Promise<KitResponse> => {
    try {
      setSaving(true);
      setError(null);
      const updated = await apiClient.put<KitResponse>(`/brands/${brandId}/kit`, { answers });
      setKit(updated);
      return updated;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save brand kit.');
      }
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    kit,
    loading,
    saving,
    error,
    refetch: fetchKit,
    saveKit,
  };
}

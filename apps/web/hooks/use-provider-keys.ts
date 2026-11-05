'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProviderKey, AddKeyRequest, KeyListResponse, ValidateKeyResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useProviderKeys(brandId: string) {
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    if (!brandId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<KeyListResponse>(`/brands/${brandId}/keys`);
      setKeys(data.keys || []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch provider keys.');
      }
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const addKey = async (request: AddKeyRequest): Promise<ProviderKey> => {
    const created = await apiClient.post<ProviderKey>(`/brands/${brandId}/keys`, request);
    await fetchKeys();
    return created;
  };

  const activateKey = async (keyId: string): Promise<ProviderKey> => {
    try {
      setError(null);
      const updated = await apiClient.patch<ProviderKey>(`/brands/${brandId}/keys/${keyId}/activate`);
      await fetchKeys();
      return updated;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to activate key.');
      }
      throw err;
    }
  };

  const validateKey = async (keyId: string): Promise<ValidateKeyResponse> => {
    try {
      setError(null);
      const result = await apiClient.post<ValidateKeyResponse>(`/brands/${brandId}/keys/${keyId}/validate`);
      await fetchKeys();
      return result;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to validate key.');
      }
      throw err;
    }
  };

  const deleteKey = async (keyId: string): Promise<void> => {
    try {
      setError(null);
      await apiClient.delete(`/brands/${brandId}/keys/${keyId}`);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete key.');
      }
      throw err;
    }
  };

  return {
    keys,
    loading,
    error,
    refetch: fetchKeys,
    addKey,
    activateKey,
    validateKey,
    deleteKey,
  };
}

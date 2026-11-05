'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brand, BrandListResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<BrandListResponse>('/brands');
      setBrands(data.brands || []);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.data.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch brands.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const createBrand = async (name: string): Promise<Brand> => {
    const newBrand = await apiClient.post<Brand>('/brands', { name });
    await fetchBrands();
    return newBrand;
  };

  const deleteBrand = async (id: string): Promise<void> => {
    await apiClient.delete(`/brands/${id}`);
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    brands,
    loading,
    error,
    refetch: fetchBrands,
    createBrand,
    deleteBrand,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminStatsResponse, AdminBrandItem, AdminBrandsResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useAdmin() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [brands, setBrands] = useState<AdminBrandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResult, brandsResult] = await Promise.all([
        apiClient.get<AdminStatsResponse>('/admin/stats'),
        apiClient.get<AdminBrandsResponse>('/admin/brands'),
      ]);

      setStats(statsResult);
      setBrands(brandsResult.items || []);
    } catch (err: unknown) {
      let message = 'Failed to load administrative data.';
      if (err instanceof ApiError) {
        message = err.data.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return {
    stats,
    brands,
    loading,
    error,
    refresh: fetchAdminData,
  };
}

'use client';

import { useState } from 'react';
import { GenerateRequest, GenerationResponse } from '@/types';
import { apiClient, ApiError } from '@/lib/api';

export function useGeneration(brandId: string) {
  const [generating, setGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (request: GenerateRequest): Promise<GenerationResponse> => {
    try {
      setGenerating(true);
      setError(null);
      const data = await apiClient.post<GenerationResponse>(`/brands/${brandId}/generate`, request);
      setResult(data);
      return data;
    } catch (err: unknown) {
      let message = 'Failed to generate image. Please try again.';
      if (err instanceof ApiError) {
        message = err.data.detail || err.message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    generating,
    result,
    error,
    generateImage,
    clearResult,
  };
}

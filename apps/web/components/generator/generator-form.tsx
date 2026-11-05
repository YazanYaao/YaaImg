'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlatformPreset, Provider, LogoMode, ProviderKey } from '@/types';
import { useGeneration } from '@/hooks/use-generation';
import { PresetSelector } from './preset-selector';
import { ProviderSelector } from './provider-selector';
import { LogoModeSelector } from './logo-mode-selector';
import { ResultPreview } from './result-preview';
import { Button } from '@/components/ui/button';

interface GeneratorFormProps {
  brandId: string;
  brandName: string;
  hasBrandLogo: boolean;
  hasBrandKit: boolean;
  activeKeys: ProviderKey[];
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({
  brandId,
  brandName,
  hasBrandLogo,
  hasBrandKit,
  activeKeys,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<PlatformPreset>('instagram_post');
  const [provider, setProvider] = useState<Provider>('qwen');
  const [model, setModel] = useState<string>('qwen-image-2.1-turbo');
  const [logoMode, setLogoMode] = useState<LogoMode>('none');
  const [includeBrandContext, setIncludeBrandContext] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }

    const initialModel = searchParams.get('model');
    if (initialModel === 'qwen-image-2.1-pro' || initialModel === 'qwen-image-2.1-turbo') {
      setModel(initialModel);
    }

    const initialPreset = searchParams.get('preset') as PlatformPreset | null;
    if (initialPreset) {
      setSelectedPreset(initialPreset);
    }
  }, [searchParams]);

  const { generating, result, error, generateImage, clearResult } = useGeneration(brandId);

  const activeProviderKey = activeKeys.find((k) => {
    const raw = k as ProviderKey & { isActive?: boolean };
    return (k.provider === 'qwen' || !k.provider) && (k.is_active || raw.isActive);
  });
  const hasActiveKey = Boolean(activeProviderKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      setValidationError('Please enter an image prompt with at least 3 characters.');
      return;
    }

    if (!hasActiveKey) {
      setValidationError('Please configure an active Qwen / DashScope API key in Keys before generating.');
      return;
    }

    try {
      await generateImage({
        prompt: trimmed,
        provider,
        model,
        platform_preset: selectedPreset,
        logo_mode: logoMode,
        include_brand_context: includeBrandContext,
      });
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Result Preview if available */}
      {result && <ResultPreview result={result} onClear={clearResult} />}

      {/* Main Generator Workstation Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Title & Introduction */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-size-2xl)' }}>✨</span>
            <div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                Image Generator Studio
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0 0' }}>
                Generate customized, on-brand social media graphics for <strong style={{ color: 'var(--color-text-primary)' }}>{brandName}</strong>.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Preset Selector */}
          <PresetSelector
            selectedPreset={selectedPreset}
            onSelect={setSelectedPreset}
          />

          {/* Provider & Model Selector */}
          <ProviderSelector
            provider={provider}
            onProviderChange={setProvider}
            model={model}
            onModelChange={setModel}
            hasActiveKey={hasActiveKey}
            brandId={brandId}
          />

          {/* Logo Mode Selector */}
          <LogoModeSelector
            logoMode={logoMode}
            onLogoModeChange={setLogoMode}
            hasBrandLogo={hasBrandLogo}
            brandId={brandId}
          />

          {/* Prompt Input & Brand Identity Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Visual Scene Prompt
              </label>

              {/* Brand Kit Identity Toggle */}
              {hasBrandKit && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontSize: 'var(--font-size-xs)',
                    color: includeBrandContext ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeBrandContext}
                    onChange={(e) => setIncludeBrandContext(e.target.checked)}
                    style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                  />
                  <span>Inject Brand Identity Context</span>
                </label>
              )}
            </div>

            <textarea
              rows={4}
              maxLength={4000}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your desired visual scene... e.g., A minimalist workspace with warm ambient lighting, modern aesthetic, clean composition, and subtle high-tech details."
              disabled={generating}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-bg-input)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-normal)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Min 3 characters
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: prompt.length >= 4000 ? 'var(--color-danger)' : 'var(--color-text-muted)',
                }}
              >
                {prompt.length}/4000
              </span>
            </div>
          </div>

          {/* Validation or API Error Alerts */}
          {validationError && (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              ⚠️ {validationError}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Generate Button & Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-4)' }}>
            {generating && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                <span>Generating & Post-processing...</span>
              </span>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={generating || !hasActiveKey}
            >
              {generating ? 'Processing Image...' : '🚀 Generate Image'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

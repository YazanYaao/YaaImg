'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GenerationResponse } from '@/types';
import { getPresetMeta } from '@/lib/presets';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  generation: GenerationResponse | null;
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (generation: GenerationResponse) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  generation,
  brandId,
  isOpen,
  onClose,
  onDelete,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!generation) return null;

  const meta = getPresetMeta(generation.platform_preset);
  const isFailed = generation.status === 'failed';
  const hasImage = Boolean(generation.image_url);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generation.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!generation.image_url) return;
    const link = document.createElement('a');
    link.href = generation.image_url;
    link.download = `yaaimg-${generation.platform_preset}-${generation.id.slice(0, 8)}.png`;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUsePromptInGenerator = () => {
    const params = new URLSearchParams();
    params.set('prompt', generation.prompt);
    params.set('provider', generation.provider);
    params.set('preset', generation.platform_preset);
    onClose();
    router.push(`/${brandId}?${params.toString()}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset Inspection" maxWidth="800px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Full Image Preview / Failure Alert */}
        <div
          style={{
            width: '100%',
            maxHeight: '480px',
            minHeight: '260px',
            backgroundColor: '#070a13',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-border)',
            position: 'relative',
          }}
        >
          {hasImage && generation.image_url ? (
            <div style={{ position: 'relative', width: '100%', height: '440px' }}>
              <Image
                src={generation.image_url}
                alt={generation.prompt}
                fill
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            </div>
          ) : isFailed ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-8)',
                textAlign: 'center',
                gap: 'var(--space-3)',
                color: 'var(--color-danger, #ef4444)',
              }}
            >
              <span style={{ fontSize: '3rem' }}>⚠️</span>
              <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0 }}>
                Generation Failed
              </h4>
              <p style={{ fontSize: 'var(--font-size-sm)', maxWidth: '420px', margin: 0, color: 'var(--color-text-secondary)' }}>
                {generation.error_message || 'An error occurred during AI image generation.'}
              </p>
              {generation.error_code && (
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Error Code: {generation.error_code}
                </span>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--color-text-muted)' }}>Image is processing...</div>
          )}
        </div>

        {/* Metadata Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-subtle, #0d121f)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Preset & Dimensions</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-accent, #00e5ff)' }}>
              {meta.label} ({meta.width} × {meta.height})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Provider & Model</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {generation.provider.toUpperCase()} ({generation.model})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Logo Mode</div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
              {generation.logo_mode}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Created At</div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              {new Date(generation.created_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Prompt Section with Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Prompt Text
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopyPrompt}>
              {copied ? '✓ Copied!' : '📋 Copy Prompt'}
            </Button>
          </div>
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-bg-subtle, #0d121f)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.5,
              maxHeight: '140px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {generation.prompt}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUsePromptInGenerator}
              style={{
                background: 'linear-gradient(135deg, var(--color-accent, #00e5ff) 0%, #0284c7 100%)',
                color: '#000000',
                fontWeight: 600,
              }}
            >
              ✨ Use Prompt in Generator
            </Button>

            {hasImage && (
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                📥 Download PNG
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onClose();
                onDelete(generation);
              }}
            >
              🗑️ Delete
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

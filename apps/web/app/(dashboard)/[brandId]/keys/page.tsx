'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProviderKeys } from '@/hooks/use-provider-keys';
import { Button } from '@/components/ui/button';
import { KeyCard } from '@/components/keys/key-card';
import { AddKeyModal } from '@/components/keys/add-key-modal';

export default function BrandKeysPage() {
  const params = useParams();
  const brandId = params?.brandId as string;

  const {
    keys,
    loading,
    error,
    addKey,
    activateKey,
    validateKey,
    deleteKey,
  } = useProviderKeys(brandId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Focus directly on Qwen keys
  const qwenKeys = keys.filter((k) => k.provider === 'qwen' || !k.provider);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-size-2xl)' }}>🔮</span>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Qwen API Keys
            </h2>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', maxWidth: '600px' }}>
            Manage your Alibaba Cloud Model Studio (DashScope) credentials for Qwen Image 2.1 generation. Keys are securely encrypted at rest in Supabase Vault.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)}>
          + Add Qwen Key
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
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

      {/* Loading Skeleton */}
      {loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ height: '180px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '180px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-bg-card)', animation: 'pulse 1.5s infinite' }} />
        </div>
      )}

      {/* Keys Grid */}
      {!loading && qwenKeys.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {qwenKeys.map((key) => (
            <KeyCard
              key={key.id}
              providerKey={key}
              onValidate={async () => {
                await validateKey(key.id);
              }}
              onActivate={async () => {
                await activateKey(key.id);
              }}
              onDelete={async () => {
                await deleteKey(key.id);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && qwenKeys.length === 0 && (
        <div
          style={{
            padding: 'var(--space-12) var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ fontSize: 'var(--font-size-3xl)' }}>🔮</div>
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            No Qwen API Keys Configured
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: 0 }}>
            Add your Alibaba Cloud Model Studio (DashScope) API key to enable image generation with Qwen Image 2.1 Turbo & Pro.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            style={{ marginTop: 'var(--space-2)' }}
          >
            + Add Qwen Key
          </Button>
        </div>
      )}

      {/* Add Key Modal */}
      <AddKeyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultProvider="qwen"
        onAddKey={addKey}
      />
    </div>
  );
}

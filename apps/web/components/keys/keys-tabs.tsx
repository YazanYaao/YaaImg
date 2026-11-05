'use client';

import React from 'react';
import { Provider } from '@/types';

interface KeysTabsProps {
  activeTab: Provider;
  onTabChange: (tab: Provider) => void;
  counts?: Partial<Record<Provider, number>>;
}

export const KeysTabs: React.FC<KeysTabsProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs: { id: Provider; label: string; icon: string }[] = [
    { id: 'openai', label: 'OpenAI', icon: '⚡' },
    { id: 'gemini', label: 'Google Gemini', icon: '✨' },
    { id: 'qwen', label: 'Qwen (DashScope)', icon: '🔮' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--space-2)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts ? counts[tab.id] : undefined;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'var(--color-bg-card)',
              border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                  color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

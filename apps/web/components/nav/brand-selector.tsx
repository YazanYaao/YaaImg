'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBrands } from '@/hooks/use-brands';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface BrandSelectorProps {
  onCreateBrandClick?: () => void;
}

export const BrandSelector: React.FC<BrandSelectorProps> = ({ onCreateBrandClick }) => {
  const router = useRouter();
  const params = useParams();
  const currentBrandId = params?.brandId as string | undefined;

  const { brands, loading } = useBrands();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeBrand = brands.find((b) => b.id === currentBrandId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectBrand = (brandId: string) => {
    setIsOpen(false);
    router.push(`/${brandId}`);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-hover)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
        }}
      >
        {activeBrand ? (
          <>
            {activeBrand.logo_url ? (
              <Image
                src={activeBrand.logo_url}
                alt={activeBrand.name}
                width={20}
                height={20}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                }}
                unoptimized
              />
            ) : (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {activeBrand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeBrand.name}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {loading ? 'Loading brands...' : brands.length > 0 ? 'Select Brand' : 'No brands'}
          </span>
        )}

        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--transition-fast)',
            color: 'var(--color-text-muted)',
          }}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--space-1))',
            left: 0,
            zIndex: 40,
            minWidth: '240px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--letter-spacing-wide)',
            }}
          >
            Your Brands
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {brands.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-2)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                }}
              >
                No brands yet
              </div>
            ) : (
              brands.map((brand) => {
                const isSelected = brand.id === currentBrandId;
                return (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)',
                      fontSize: 'var(--font-size-sm)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--color-bg-card-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', overflow: 'hidden' }}>
                      {brand.logo_url ? (
                        <Image
                          src={brand.logo_url}
                          alt={brand.name}
                          width={20}
                          height={20}
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                          unoptimized
                        />
                      ) : (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-accent)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {brand.name}
                      </span>
                    </div>

                    <Badge status={brand.kit_status} />
                  </button>
                );
              })
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--color-border)', margin: 'var(--space-1) 0' }} />

          <button
            onClick={() => {
              setIsOpen(false);
              if (onCreateBrandClick) {
                onCreateBrandClick();
              } else {
                router.push('/brands');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              width: '100%',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-accent)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>+</span> Create New Brand
          </button>
        </div>
      )}
    </div>
  );
};

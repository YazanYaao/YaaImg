'use client';

import React, { useState, useEffect } from 'react';
import { KitResponse, KitAnswers, Tone } from '@/types';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './step-indicator';
import { StepName } from './step-name';
import { StepTagline } from './step-tagline';
import { StepTone } from './step-tone';
import { StepAudience } from './step-audience';
import { StepColors } from './step-colors';
import { StepAvoid } from './step-avoid';
import { KitSummary } from './kit-summary';

interface WizardContainerProps {
  brandName: string;
  kit: KitResponse | null;
  onSave: (answers: KitAnswers) => Promise<KitResponse>;
  saving: boolean;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({
  brandName,
  kit,
  onSave,
  saving,
}) => {
  const [tagline, setTagline] = useState<string | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [audience, setAudience] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [avoidWords, setAvoidWords] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when kit data loads or changes
  useEffect(() => {
    if (kit?.answers) {
      setTagline(kit.answers.tagline);
      setTone(kit.answers.tone);
      setAudience(kit.answers.audience);
      setColors(kit.answers.colors || []);
      setAvoidWords(kit.answers.avoid_words);
    }
  }, [kit]);

  // Which steps have answers filled for the indicator
  const completedFields: Record<number, boolean> = {
    1: Boolean(brandName),
    2: Boolean(tagline && tagline.trim().length > 0),
    3: Boolean(tone),
    4: Boolean(audience && audience.trim().length >= 2),
    5: colors.length >= 1,
    6: Boolean(avoidWords && avoidWords.trim().length > 0),
  };

  const getAnswersObject = (): KitAnswers => ({
    tagline,
    tone,
    audience,
    colors,
    avoid_words: avoidWords,
  });

  const handleSaveAndExit = async () => {
    try {
      setSaveFeedback(null);
      setValidationError(null);
      await onSave(getAnswersObject());
      setSaveFeedback({ type: 'success', text: 'Progress saved successfully.' });
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch {
      setSaveFeedback({ type: 'error', text: 'Failed to save progress. Please try again.' });
    }
  };

  const handleComplete = async () => {
    setValidationError(null);
    setSaveFeedback(null);

    // Validate required fields
    if (!tone) {
      setValidationError('Please select a Tone of Voice in Step 3.');
      setCurrentStep(3);
      return;
    }

    if (!audience || audience.trim().length < 2) {
      setValidationError('Please enter a Target Audience (at least 2 characters) in Step 4.');
      setCurrentStep(4);
      return;
    }

    if (colors.length === 0) {
      setValidationError('Please choose at least 1 Brand Color in Step 5.');
      setCurrentStep(5);
      return;
    }

    try {
      await onSave(getAnswersObject());
      setIsEditing(false);
      setSaveFeedback({ type: 'success', text: 'Brand kit completed successfully! 🎉' });
    } catch {
      setSaveFeedback({ type: 'error', text: 'Failed to complete brand kit. Please try again.' });
    }
  };

  // If already complete and not currently in edit mode, display the summary
  if (kit && kit.status === 'complete' && !isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {saveFeedback && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: saveFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: saveFeedback.type === 'success' ? '1px solid var(--color-success)' : '1px solid var(--color-danger)',
              color: saveFeedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {saveFeedback.text}
          </div>
        )}
        <KitSummary kit={kit} onEdit={() => setIsEditing(true)} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Wizard Header & Progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Brand Kit Wizard
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
              Step {currentStep} of 6 — Configure your brand identity to guide AI image generation.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            💾 Save Draft
          </Button>
        </div>

        <StepIndicator
          currentStep={currentStep}
          onStepClick={(s) => {
            setValidationError(null);
            setCurrentStep(s);
          }}
          completedFields={completedFields}
        />
      </div>

      {/* Validation or Save Feedback Alert */}
      {validationError && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            color: 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {saveFeedback && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: saveFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: saveFeedback.type === 'success' ? '1px solid var(--color-success)' : '1px solid var(--color-danger)',
            color: saveFeedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          {saveFeedback.text}
        </div>
      )}

      {/* Current Step Content Box */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-md)',
          minHeight: '340px',
        }}
      >
        {currentStep === 1 && <StepName brandName={brandName} />}
        {currentStep === 2 && <StepTagline value={tagline} onChange={setTagline} />}
        {currentStep === 3 && <StepTone value={tone} onChange={setTone} />}
        {currentStep === 4 && <StepAudience value={audience} onChange={setAudience} />}
        {currentStep === 5 && <StepColors value={colors} onChange={setColors} />}
        {currentStep === 6 && <StepAvoid value={avoidWords} onChange={setAvoidWords} />}
      </div>

      {/* Navigation Buttons Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-2)',
        }}
      >
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setValidationError(null);
                setCurrentStep((s) => s - 1);
              }}
              disabled={saving}
            >
              ← Previous
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {currentStep < 6 ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setValidationError(null);
                setCurrentStep((s) => s + 1);
              }}
              disabled={saving}
            >
              Next Step →
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? 'Completing...' : '✓ Complete Brand Kit'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

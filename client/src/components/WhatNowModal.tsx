import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Navigation,
  Train,
  Bus,
  Car,
  Footprints,
  Info,
  Clock,
  Sparkles,
  Ticket,
  AlertTriangle
} from 'lucide-react';
import { NavigationSession, RouteOption } from '../types/shared';

interface WhatNowModalProps {
  session: NavigationSession;
  route: RouteOption;
  onAdvance: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export const WhatNowModal: React.FC<WhatNowModalProps> = ({
  session,
  route,
  onAdvance,
  onPrevious,
  onClose
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentLeg = session.currentLeg;
  const isCompleted = session.status === 'completed';
  const progressPercent = session.progressPercent || 0;

  // Web Speech API Text-to-Speech
  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${currentLeg.instruction}. ${currentLeg.guidanceTip || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const renderHeroIcon = (mode: string) => {
    switch (mode) {
      case 'metro':
        return <Train size={36} color="#ffffff" />;
      case 'train':
        return <Train size={36} color="#ffffff" />;
      case 'bus':
        return <Bus size={36} color="#ffffff" />;
      case 'auto':
      case 'cab':
        return <Car size={36} color="#ffffff" />;
      default:
        return <Footprints size={36} color="#ffffff" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'metro':
        return { bg: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)' };
      case 'train':
        return { bg: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)' };
      case 'bus':
        return { bg: '#d97706', gradient: 'linear-gradient(135deg, #d97706, #b45309)' };
      case 'auto':
      case 'cab':
        return { bg: '#059669', gradient: 'linear-gradient(135deg, #059669, #047857)' };
      default:
        return { bg: '#475569', gradient: 'linear-gradient(135deg, #475569, #334155)' };
    }
  };

  const modeTheme = getModeColor(currentLeg?.mode || 'walk');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '1.25rem',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Top Header: Progress Bar & Exit Button */}
        <div style={{
          padding: '1rem 1.25rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid #bfdbfe'
              }}>
                WHAT DO I DO NOW?
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                Step {session.currentLegIndex + 1} of {session.totalLegs}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              ~{session.remainingMinutes} min remaining to destination
            </div>
          </div>

          <button
            onClick={onClose}
            title="Exit Guidance"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar line */}
        <div style={{ height: '5px', background: '#e2e8f0', width: '100%' }}>
          <div style={{
            height: '100%',
            background: '#2563eb',
            width: `${isCompleted ? 100 : progressPercent}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>

        {/* Content Body */}
        {isCompleted ? (
          /* Journey Finished Celebration View */
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 8px 20px rgba(22, 163, 74, 0.2)'
            }}>
              <CheckCircle2 size={44} />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              You've Arrived at Your Destination!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              You successfully navigated <b>{route.title}</b> in Mumbai. How did your journey go?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Complete & Return to Map
              </button>
            </div>
          </div>
        ) : (
          /* Active Step View */
          <div style={{ padding: '1.5rem' }}>
            {/* Step Hero Card */}
            <div style={{
              background: modeTheme.gradient,
              borderRadius: '1rem',
              padding: '1.25rem',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
              position: 'relative',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {renderHeroIcon(currentLeg.mode)}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Current Action
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                      {currentLeg.lineName || currentLeg.mode.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Voice speech button */}
                <button
                  onClick={handleSpeak}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              {/* Primary Instruction in big bold typography */}
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                lineHeight: 1.4,
                marginBottom: '0.5rem'
              }}>
                {currentLeg.instruction}
              </div>

              {/* Sub-info: distance and duration */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.9 }}>
                <span>⏱️ ~{currentLeg.durationMinutes} min</span>
                {currentLeg.distanceMeters > 0 && (
                  <span>📏 {currentLeg.distanceMeters > 1000 ? `${(currentLeg.distanceMeters / 1000).toFixed(1)} km` : `${currentLeg.distanceMeters}m`}</span>
                )}
                {currentLeg.platform && (
                  <span>🚉 {currentLeg.platform}</span>
                )}
              </div>
            </div>

            {/* Turn-by-Turn Life Guidance (Contextual Tip) */}
            {currentLeg.guidanceTip && (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '0.85rem',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}>
                <div style={{
                  background: '#16a34a',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>
                  <Info size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                    Local Life Tip
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#166534', fontWeight: 600, marginTop: '0.15rem', lineHeight: 1.4 }}>
                    {currentLeg.guidanceTip}
                  </div>
                </div>
              </div>
            )}

            {/* Ticketing & Fare Advice */}
            {currentLeg.fareDetails && (
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '0.85rem',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}>
                <Ticket size={20} color="#b45309" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                    Fare & Ticket Advice
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600 }}>
                    {currentLeg.fareDetails.bookingMethod} — ₹{currentLeg.fareDetails.price}
                  </div>
                </div>
              </div>
            )}

            {/* Up Next Step Preview */}
            {session.nextLeg && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '0.65rem 0.95rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Up Next:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{session.nextLeg.instruction}</span>
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {session.currentLegIndex > 0 && (
                <button
                  onClick={onPrevious}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={onAdvance}
                className="btn-hover-scale"
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>✅ I Did This → Next Step</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

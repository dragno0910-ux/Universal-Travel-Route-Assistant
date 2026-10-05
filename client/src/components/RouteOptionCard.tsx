import React, { useState } from 'react';
import {
  Clock,
  Coins,
  Footprints,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bookmark,
  Navigation2,
  Train,
  Bus,
  Car,
  CheckCircle2,
  Info,
  ShieldAlert
} from 'lucide-react';
import { RouteOption, ItineraryLeg } from '../types/shared';

interface RouteOptionCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: () => void;
  onStartNavigation: () => void;
  onAskAIExplanation: () => void;
  onSaveTrip: () => void;
}

export const RouteOptionCard: React.FC<RouteOptionCardProps> = ({
  route,
  isSelected,
  onSelect,
  onStartNavigation,
  onAskAIExplanation,
  onSaveTrip
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTagColor = (tag: RouteOption['tag']) => {
    switch (tag) {
      case 'Fastest':
        return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      case 'Cheapest':
        return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
      case 'Comfort / Luggage':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      case 'Direct Cab':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    }
  };

  const tagColor = getTagColor(route.tag);

  const renderModeIcon = (mode: ItineraryLeg['mode']) => {
    switch (mode) {
      case 'metro':
        return <Train size={15} color="#2563eb" />;
      case 'train':
        return <Train size={15} color="#dc2626" />;
      case 'bus':
        return <Bus size={15} color="#d97706" />;
      case 'auto':
      case 'cab':
        return <Car size={15} color="#059669" />;
      default:
        return <Footprints size={15} color="#64748b" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? '#ffffff' : '#ffffff',
        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
        borderRadius: '1rem',
        padding: '1.15rem',
        marginBottom: '0.85rem',
        boxShadow: isSelected ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : '0 2px 6px rgba(0, 0, 0, 0.03)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Top Header: Tag Badge + Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: tagColor.bg,
              color: tagColor.text,
              border: `1px solid ${tagColor.border}`,
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px'
            }}
          >
            {route.tag}
          </span>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            {route.title}
          </h3>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onSaveTrip}
            title="Save Route"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.45rem',
              padding: '0.35rem',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Bookmark size={15} />
          </button>
        </div>
      </div>

      {/* Main Metrics: Time, Cost, Transfers, Walking */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        background: '#f8fafc',
        borderRadius: '0.75rem',
        padding: '0.75rem',
        marginBottom: '0.75rem'
      }}>
        {/* Duration */}
        <div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Duration</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
            <Clock size={15} color="#2563eb" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              {route.durationMinutes} min
            </span>
          </div>
        </div>

        {/* Fare */}
        <div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Fare</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
            <Coins size={15} color="#059669" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857' }}>
              ₹{route.totalCostINR}
            </span>
          </div>
        </div>

        {/* Transfers */}
        <div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Transfers</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', display: 'block', marginTop: '0.15rem' }}>
            {route.transfers === 0 ? 'Direct' : `${route.transfers} transfer`}
          </span>
        </div>

        {/* Walking */}
        <div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Walking</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
            <Footprints size={14} color="#64748b" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
              {route.walkingDistanceMeters > 1000
                ? `${(route.walkingDistanceMeters / 1000).toFixed(1)} km`
                : `${route.walkingDistanceMeters}m`}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Journey Mode Chain */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        flexWrap: 'wrap',
        marginBottom: '0.75rem',
        padding: '0.25rem 0'
      }}>
        {route.legs.map((leg, idx) => (
          <React.Fragment key={leg.id || idx}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#334155'
            }}>
              {renderModeIcon(leg.mode)}
              <span>{leg.lineName || (leg.mode === 'walk' ? `${leg.distanceMeters}m` : leg.mode.toUpperCase())}</span>
            </div>
            {idx < route.legs.length - 1 && (
              <ArrowRight size={13} color="#94a3b8" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Primary CTAs: Start Navigation & AI Tips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
        {/* What do I do now Navigation CTA */}
        <button
          onClick={onStartNavigation}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.65rem',
            padding: '0.6rem 0.9rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Navigation2 size={16} />
          <span>Start "What Now?" Guidance</span>
        </button>

        {/* AI Explanation Button */}
        <button
          onClick={onAskAIExplanation}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            background: '#eff6ff',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '0.65rem',
            padding: '0.6rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Sparkles size={16} />
          <span>AI Tips</span>
        </button>

        {/* Accordion toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.65rem',
            padding: '0.6rem 0.75rem',
            cursor: 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Turn-by-Turn Life Steps */}
      {isExpanded && (
        <div style={{
          marginTop: '0.85rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            Itinerary Breakdown ({route.legs.length} Steps)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {route.legs.map((leg, idx) => (
              <div
                key={leg.id || idx}
                style={{
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'flex-start',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.65rem',
                  padding: '0.65rem 0.8rem'
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                    {leg.instruction}
                  </div>

                  {leg.guidanceTip && (
                    <div style={{
                      marginTop: '0.3rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      color: '#0369a1',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '0.45rem'
                    }}>
                      <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                      <span>{leg.guidanceTip}</span>
                    </div>
                  )}

                  {leg.fareDetails && (
                    <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                      🎫 {leg.fareDetails.bookingMethod} (₹{leg.fareDetails.price})
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textAlign: 'right', flexShrink: 0 }}>
                  {leg.durationMinutes} min
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Compass, Sparkles, Bookmark, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { LiveDisruption } from '../types/shared';

interface NavbarProps {
  alerts: LiveDisruption[];
  onOpenAI: () => void;
  onOpenSaved: () => void;
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ alerts, onOpenAI, onOpenSaved, onOpenAlerts }) => {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
        }}>
          <Compass size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Mumbai Route Guide
            </h1>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: '#eff6ff',
              color: '#2563eb',
              padding: '0.15rem 0.45rem',
              borderRadius: '9999px',
              border: '1px solid #bfdbfe'
            }}>
              Mumbai Pilot
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Turn-by-turn life guidance for unfamiliar travelers
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Live Alerts Pill */}
        {alerts.length > 0 && (
          <button
            onClick={onOpenAlerts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '9999px',
              padding: '0.4rem 0.8rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShieldAlert size={15} />
            <span>Transit Alerts ({alerts.length})</span>
          </button>
        )}

        {/* AI Travel Guide Button */}
        <button
          onClick={onOpenAI}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.45rem 0.95rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
          }}
        >
          <Sparkles size={16} />
          <span>Ask AI Assistant</span>
        </button>

        {/* Saved Trips */}
        <button
          onClick={onOpenSaved}
          title="Saved Routes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '9999px',
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Bookmark size={16} />
          <span>Saved</span>
        </button>
      </div>
    </header>
  );
};

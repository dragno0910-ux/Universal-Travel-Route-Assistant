import React from 'react';
import { ShieldAlert, X, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { LiveDisruption } from '../types/shared';

interface AlertsModalProps {
  isOpen: boolean;
  alerts: LiveDisruption[];
  onClose: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, alerts, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 2200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fffbeb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={20} color="#b45309" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>
              Live Mumbai Transit Status
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts list */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map((alt) => {
            const isWarning = alt.severity === 'warning';
            return (
              <div
                key={alt.id}
                style={{
                  border: isWarning ? '1.5px solid #fde68a' : '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '0.85rem',
                  background: isWarning ? '#fffdf5' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {isWarning ? <AlertTriangle size={18} color="#d97706" /> : <Info size={18} color="#2563eb" />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      {alt.line}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      {alt.agency}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {alt.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

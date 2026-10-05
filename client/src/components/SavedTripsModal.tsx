import React from 'react';
import { Bookmark, X, Trash2, ArrowRight, Clock, Coins } from 'lucide-react';
import { SavedTrip } from '../types/shared';

interface SavedTripsModalProps {
  isOpen: boolean;
  trips: SavedTrip[];
  onClose: () => void;
  onSelectTrip: (trip: SavedTrip) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  trips,
  onClose,
  onSelectTrip,
  onDeleteTrip
}) => {
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
        maxWidth: '480px',
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
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              Saved Journeys ({trips.length})
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

        {/* Content list */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '1rem' }}>
          {trips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
              <p style={{ fontSize: '0.88rem' }}>No saved trips yet.</p>
              <p style={{ fontSize: '0.76rem', marginTop: '0.25rem' }}>
                Click the bookmark icon on any route card to save it for quick offline access!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '0.85rem',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'border 0.2s ease'
                  }}
                  onClick={() => {
                    onSelectTrip(trip);
                    onClose();
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {trip.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {trip.originName} → {trip.destinationName}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.72rem', color: '#475569', fontWeight: 600 }}>
                      <span>⏱️ {trip.routeData.durationMinutes} min</span>
                      <span>💰 ₹{trip.routeData.totalCostINR}</span>
                      <span>🔄 {trip.routeData.transfers} transfers</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTrip(trip.id);
                      }}
                      title="Delete saved trip"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '0.45rem',
                        padding: '0.4rem',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <ArrowRight size={16} color="#2563eb" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

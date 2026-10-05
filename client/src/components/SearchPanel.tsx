import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  Luggage,
  Accessibility,
  Zap,
  Coins,
  Footprints,
  Sparkles
} from 'lucide-react';
import { Place, TravelPreferences } from '../types/shared';
import { api } from '../services/api';

interface SearchPanelProps {
  origin: Place | null;
  destination: Place | null;
  preferences: TravelPreferences;
  isLoading: boolean;
  onSetOrigin: (place: Place) => void;
  onSetDestination: (place: Place) => void;
  onUpdatePreferences: (prefs: TravelPreferences) => void;
  onCalculateRoute: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  origin,
  destination,
  preferences,
  isLoading,
  onSetOrigin,
  onSetDestination,
  onUpdatePreferences,
  onCalculateRoute
}) => {
  const [originQuery, setOriginQuery] = useState(origin?.name || '');
  const [destQuery, setDestQuery] = useState(destination?.name || '');
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (origin) setOriginQuery(origin.name);
  }, [origin]);

  useEffect(() => {
    if (destination) setDestQuery(destination.name);
  }, [destination]);

  // Autocomplete debounce
  useEffect(() => {
    if (originQuery.trim().length > 1 && showOriginDropdown) {
      const timer = setTimeout(async () => {
        try {
          const results = await api.searchPlaces(originQuery);
          setOriginSuggestions(results);
        } catch (e) {
          console.error(e);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setOriginSuggestions([]);
    }
  }, [originQuery, showOriginDropdown]);

  useEffect(() => {
    if (destQuery.trim().length > 1 && showDestDropdown) {
      const timer = setTimeout(async () => {
        try {
          const results = await api.searchPlaces(destQuery);
          setDestSuggestions(results);
        } catch (e) {
          console.error(e);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setDestSuggestions([]);
    }
  }, [destQuery, showDestDropdown]);

  // Swap origin and destination
  const handleSwap = () => {
    if (origin && destination) {
      onSetOrigin(destination);
      onSetDestination(origin);
    }
  };

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            const place = await api.reverseGeocode(lat, lng);
            onSetOrigin(place);
            setOriginQuery(place.name);
          } catch (e) {
            onSetOrigin({
              id: 'gps_curr',
              name: 'My Current Location',
              displayName: `Current GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              lat,
              lng,
              type: 'locality',
              city: 'Mumbai'
            });
          }
        },
        (error) => {
          alert('Could not retrieve current location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Quick Preset Routes
  const handleQuickPreset = (preset: 'airport_gateway' | 'bandra_bkc' | 'andheri_csmt') => {
    if (preset === 'airport_gateway') {
      onSetOrigin({
        id: 'lm_airport_t2',
        name: 'Mumbai Airport (T2)',
        displayName: 'Chhatrapati Shivaji Maharaj International Airport Terminal 2',
        lat: 19.0896,
        lng: 72.8656,
        type: 'airport',
        city: 'Mumbai'
      });
      onSetDestination({
        id: 'lm_gateway_of_india',
        name: 'Gateway of India',
        displayName: 'Gateway of India & Taj Mahal Palace, Colaba',
        lat: 18.9220,
        lng: 72.8347,
        type: 'landmark',
        city: 'Mumbai'
      });
    } else if (preset === 'bandra_bkc') {
      onSetOrigin({
        id: 'wr_bandra',
        name: 'Bandra Station',
        displayName: 'Bandra Railway Station (Western & Harbour)',
        lat: 19.0544,
        lng: 72.8406,
        type: 'railway_station',
        city: 'Mumbai'
      });
      onSetDestination({
        id: 'lm_bkc',
        name: 'Bandra-Kurla Complex (BKC)',
        displayName: 'Bandra-Kurla Complex Commercial Hub',
        lat: 19.0660,
        lng: 72.8680,
        type: 'commercial',
        city: 'Mumbai'
      });
    } else if (preset === 'andheri_csmt') {
      onSetOrigin({
        id: 'wr_andheri',
        name: 'Andheri Station',
        displayName: 'Andheri Metro & Railway Hub',
        lat: 19.1197,
        lng: 72.8466,
        type: 'railway_station',
        city: 'Mumbai'
      });
      onSetDestination({
        id: 'cr_csmt',
        name: 'CSMT Station',
        displayName: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Fort',
        lat: 18.9400,
        lng: 72.8354,
        type: 'railway_station',
        city: 'Mumbai'
      });
    }
  };

  return (
    <div className="glass-panel" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
      {/* Quick Benchmark Routes */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Popular Mumbai Routes (1-Click Test)
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleQuickPreset('airport_gateway')}
            style={{
              fontSize: '0.74rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            ✈️ Airport T2 → Gateway of India
          </button>
          <button
            onClick={() => handleQuickPreset('bandra_bkc')}
            style={{
              fontSize: '0.74rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🏢 Bandra → BKC
          </button>
          <button
            onClick={() => handleQuickPreset('andheri_csmt')}
            style={{
              fontSize: '0.74rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '9999px',
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            🚆 Andheri → CSMT
          </button>
        </div>
      </div>

      {/* Origin Input */}
      <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '0.75rem',
          padding: '0.6rem 0.85rem'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 800
          }}>
            A
          </div>
          <input
            type="text"
            placeholder="Starting location (e.g. Mumbai Airport T2, Dadar)"
            value={originQuery}
            onChange={(e) => {
              setOriginQuery(e.target.value);
              setShowOriginDropdown(true);
            }}
            onFocus={() => setShowOriginDropdown(true)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#0f172a'
            }}
          />
          <button
            onClick={handleUseCurrentLocation}
            title="Use current GPS location"
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Navigation size={17} />
          </button>
        </div>

        {/* Origin Autocomplete Dropdown */}
        {showOriginDropdown && originSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            marginTop: '4px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            {originSuggestions.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  onSetOrigin(place);
                  setOriginQuery(place.name);
                  setShowOriginDropdown(false);
                }}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  {place.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {place.displayName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.3rem 0' }}>
        <button
          onClick={handleSwap}
          title="Swap origin and destination"
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* Destination Input */}
      <div style={{ position: 'relative', marginTop: '-0.3rem', marginBottom: '0.85rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '0.75rem',
          padding: '0.6rem 0.85rem'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 800
          }}>
            B
          </div>
          <input
            type="text"
            placeholder="Destination (e.g. Gateway of India, BKC)"
            value={destQuery}
            onChange={(e) => {
              setDestQuery(e.target.value);
              setShowDestDropdown(true);
            }}
            onFocus={() => setShowDestDropdown(true)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#0f172a'
            }}
          />
        </div>

        {/* Destination Autocomplete Dropdown */}
        {showDestDropdown && destSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            marginTop: '4px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto'
          }}>
            {destSuggestions.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  onSetDestination(place);
                  setDestQuery(place.name);
                  setShowDestDropdown(false);
                }}
                style={{
                  padding: '0.65rem 0.9rem',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  {place.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {place.displayName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences Pill Toggle */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
            Routing Preference:
          </span>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            style={{
              fontSize: '0.74rem',
              color: '#2563eb',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontWeight: 600
            }}
          >
            <SlidersHorizontal size={13} />
            <span>{showPreferences ? 'Hide Filters' : 'More Constraints'}</span>
          </button>
        </div>

        {/* Priority Radio Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
          {[
            { id: 'fastest', label: 'Fastest', icon: <Zap size={13} /> },
            { id: 'cheapest', label: 'Cheapest', icon: <Coins size={13} /> },
            { id: 'comfort', label: 'Luggage', icon: <Luggage size={13} /> },
            { id: 'least_walking', label: 'Less Walk', icon: <Footprints size={13} /> }
          ].map((item) => {
            const isSelected = (preferences.priority || 'fastest') === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onUpdatePreferences({ ...preferences, priority: item.id as any })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  padding: '0.4rem 0.2rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#64748b'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Preferences Drawer */}
      {showPreferences && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '0.75rem',
          padding: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={!!preferences.luggageFriendly}
                onChange={(e) => onUpdatePreferences({ ...preferences, luggageFriendly: e.target.checked })}
              />
              <span>🧳 Luggage Friendly (Avoid stairs)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={!!preferences.accessibilityRequired}
                onChange={(e) => onUpdatePreferences({ ...preferences, accessibilityRequired: e.target.checked })}
              />
              <span>♿ Wheelchair / Step-free</span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Max Budget:</span>
            <input
              type="number"
              placeholder="e.g. 250"
              value={preferences.maxBudgetINR || ''}
              onChange={(e) => onUpdatePreferences({
                ...preferences,
                maxBudgetINR: e.target.value ? parseInt(e.target.value, 10) : undefined
              })}
              style={{
                width: '90px',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.35rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem'
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>INR (₹)</span>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={onCalculateRoute}
        disabled={isLoading || !origin || !destination}
        className="btn-hover-scale"
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.75rem',
          background: !origin || !destination ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#ffffff',
          border: 'none',
          fontSize: '0.92rem',
          fontWeight: 800,
          cursor: !origin || !destination ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: !origin || !destination ? 'none' : '0 4px 15px rgba(37, 99, 235, 0.35)'
        }}
      >
        {isLoading ? (
          <span>Calculating verified routes...</span>
        ) : (
          <>
            <Search size={18} />
            <span>Find Best Mumbai Routes</span>
          </>
        )}
      </button>
    </div>
  );
};

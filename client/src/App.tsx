import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SearchPanel } from './components/SearchPanel';
import { MapComponent } from './components/MapComponent';
import { RouteOptionCard } from './components/RouteOptionCard';
import { WhatNowModal } from './components/WhatNowModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { SavedTripsModal } from './components/SavedTripsModal';
import { AlertsModal } from './components/AlertsModal';
import {
  Place,
  RouteOption,
  TravelPreferences,
  NavigationSession,
  LiveDisruption,
  SavedTrip
} from './types/shared';
import { api } from './services/api';

export const App: React.FC = () => {
  // Places state — Default: Mumbai Airport T2 to Gateway of India (The MVP Benchmark from Section 5)
  const [origin, setOrigin] = useState<Place>({
    id: 'lm_airport_t2',
    name: 'Mumbai Airport (T2)',
    displayName: 'Chhatrapati Shivaji Maharaj International Airport Terminal 2, Sahar',
    lat: 19.0896,
    lng: 72.8656,
    type: 'airport',
    city: 'Mumbai',
    accessibility: true
  });

  const [destination, setDestination] = useState<Place>({
    id: 'lm_gateway_of_india',
    name: 'Gateway of India',
    displayName: 'Gateway of India & Taj Mahal Palace, Colaba',
    lat: 18.9220,
    lng: 72.8347,
    type: 'landmark',
    city: 'Mumbai',
    accessibility: true
  });

  const [preferences, setPreferences] = useState<TravelPreferences>({
    priority: 'fastest',
    luggageFriendly: false,
    accessibilityRequired: false
  });

  // Routes state
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // Navigation session state ("What do I do now?" mode)
  const [navigationSession, setNavigationSession] = useState<NavigationSession | null>(null);
  const [activeStepCoords, setActiveStepCoords] = useState<[number, number] | null>(null);

  // Auxiliary state
  const [alerts, setAlerts] = useState<LiveDisruption[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  // Modals & Drawers
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isWhatNowOpen, setIsWhatNowOpen] = useState(false);

  // Load initial data and run first calculation
  useEffect(() => {
    // 1. Fetch live alerts
    api.getAlerts()
      .then(setAlerts)
      .catch((e) => console.warn('Could not load alerts:', e));

    // 2. Fetch saved trips
    api.getSavedTrips()
      .then(setSavedTrips)
      .catch((e) => console.warn('Could not load saved trips:', e));

    // 3. Compute initial route for default A -> B (Mumbai Airport T2 -> Gateway of India)
    handleCalculateRoute();
  }, []);

  // Compute Routes
  const handleCalculateRoute = async () => {
    if (!origin || !destination) return;
    setIsLoadingRoutes(true);
    try {
      const response = await api.calculateRoutes({
        origin: { lat: origin.lat, lng: origin.lng, name: origin.name },
        destination: { lat: destination.lat, lng: destination.lng, name: destination.name },
        preferences
      });

      setRoutes(response.routes);
      if (response.routes.length > 0) {
        setSelectedRoute(response.routes[0]);
      }
    } catch (err) {
      console.error('Failed to compute routes:', err);
      alert('Could not compute routes. Please check your network connection.');
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Launch "What Do I Do Now?" Navigation
  const handleStartNavigation = async (routeToNavigate?: RouteOption) => {
    const targetRoute = routeToNavigate || selectedRoute;
    if (!targetRoute) return;

    try {
      const session = await api.startNavigation(targetRoute);
      setNavigationSession(session);
      setActiveStepCoords(session.currentLeg.startCoords);
      setIsWhatNowOpen(true);
    } catch (err) {
      console.error('Failed to start navigation:', err);
      alert('Could not start navigation guidance.');
    }
  };

  // Advance Navigation Step
  const handleAdvanceStep = async () => {
    if (!navigationSession) return;
    try {
      const updated = await api.advanceStep(navigationSession.sessionId);
      setNavigationSession(updated);
      if (updated.currentLeg) {
        setActiveStepCoords(updated.currentLeg.startCoords);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Previous Navigation Step
  const handlePreviousStep = async () => {
    if (!navigationSession) return;
    try {
      const updated = await api.previousStep(navigationSession.sessionId);
      setNavigationSession(updated);
      if (updated.currentLeg) {
        setActiveStepCoords(updated.currentLeg.startCoords);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Close Navigation
  const handleCloseNavigation = async () => {
    if (navigationSession) {
      await api.cancelNavigation(navigationSession.sessionId).catch(() => {});
    }
    setNavigationSession(null);
    setActiveStepCoords(null);
    setIsWhatNowOpen(false);
  };

  // Save Trip
  const handleSaveTrip = async (routeToSave: RouteOption) => {
    try {
      const trip = await api.saveTrip({
        label: `${routeToSave.title} (${origin.name} → ${destination.name})`,
        originName: origin.name,
        destinationName: destination.name,
        originCoords: [origin.lat, origin.lng],
        destinationCoords: [destination.lat, destination.lng],
        routeData: routeToSave
      });
      setSavedTrips((prev) => [trip, ...prev]);
      alert('Journey saved to your favorites!');
    } catch (e) {
      alert('Failed to save trip.');
    }
  };

  // Delete Saved Trip
  const handleDeleteTrip = async (id: string) => {
    try {
      await api.deleteTrip(id);
      setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Select Saved Trip
  const handleSelectSavedTrip = (trip: SavedTrip) => {
    setOrigin({
      id: `saved_orig_${Date.now()}`,
      name: trip.originName,
      displayName: trip.originName,
      lat: trip.originCoords[0],
      lng: trip.originCoords[1],
      type: 'locality',
      city: 'Mumbai'
    });
    setDestination({
      id: `saved_dest_${Date.now()}`,
      name: trip.destinationName,
      displayName: trip.destinationName,
      lat: trip.destinationCoords[0],
      lng: trip.destinationCoords[1],
      type: 'locality',
      city: 'Mumbai'
    });
    setRoutes([trip.routeData]);
    setSelectedRoute(trip.routeData);
  };

  // Apply AI Intent to Search
  const handleApplyAIIntent = async (
    extractedPrefs: TravelPreferences,
    originQ?: string,
    destQ?: string
  ) => {
    const newPrefs = { ...preferences, ...extractedPrefs };
    setPreferences(newPrefs);

    if (originQ) {
      const searchRes = await api.searchPlaces(originQ);
      if (searchRes.length > 0) setOrigin(searchRes[0]);
    }

    if (destQ) {
      const searchRes = await api.searchPlaces(destQ);
      if (searchRes.length > 0) setDestination(searchRes[0]);
    }

    // Auto trigger recalculation with updated parameters
    setTimeout(() => {
      handleCalculateRoute();
    }, 150);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <Navbar
        alerts={alerts}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenSaved={() => setIsSavedOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Main Two-Column Layout */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Side: Search Panel & Route Comparison Cards */}
        <div style={{
          width: '460px',
          height: '100%',
          overflowY: 'auto',
          padding: '1.25rem',
          background: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          flexShrink: 0
        }}>
          {/* Search & Constraints Panel */}
          <SearchPanel
            origin={origin}
            destination={destination}
            preferences={preferences}
            isLoading={isLoadingRoutes}
            onSetOrigin={setOrigin}
            onSetDestination={setDestination}
            onUpdatePreferences={setPreferences}
            onCalculateRoute={handleCalculateRoute}
          />

          {/* Route Comparison List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Route Options ({routes.length})
              </h2>
              {routes.length > 0 && (
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Sorted by {preferences.priority || 'fastest'}
                </span>
              )}
            </div>

            {isLoadingRoutes ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: '#ffffff',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🧭</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Evaluating Mumbai Road & Transit Networks...
                </div>
                <div style={{ fontSize: '0.74rem', marginTop: '0.25rem' }}>
                  Querying Metro, Local trains, Cabs, and Walking paths
                </div>
              </div>
            ) : routes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: '#ffffff',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                color: '#64748b'
              }}>
                <p style={{ fontSize: '0.85rem' }}>No routes calculated yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Select starting and destination points above and click Find Best Route.
                </p>
              </div>
            ) : (
              routes.map((route) => (
                <RouteOptionCard
                  key={route.id}
                  route={route}
                  isSelected={selectedRoute?.id === route.id}
                  onSelect={() => setSelectedRoute(route)}
                  onStartNavigation={() => handleStartNavigation(route)}
                  onAskAIExplanation={() => setIsAIOpen(true)}
                  onSaveTrip={() => handleSaveTrip(route)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Side: Interactive Leaflet Map */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <MapComponent
            origin={origin}
            destination={destination}
            selectedRoute={selectedRoute}
            activeStepCoords={activeStepCoords}
            onSelectCoords={async (lat, lng) => {
              const place = await api.reverseGeocode(lat, lng);
              setDestination(place);
            }}
          />
        </div>
      </div>

      {/* "What Do I Do Now?" Step-by-Step Navigation Hero Modal */}
      {isWhatNowOpen && navigationSession && selectedRoute && (
        <WhatNowModal
          session={navigationSession}
          route={selectedRoute}
          onAdvance={handleAdvanceStep}
          onPrevious={handlePreviousStep}
          onClose={handleCloseNavigation}
        />
      )}

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        activeRoute={selectedRoute}
        onClose={() => setIsAIOpen(false)}
        onApplyPreferences={handleApplyAIIntent}
      />

      {/* Saved Trips Modal */}
      <SavedTripsModal
        isOpen={isSavedOpen}
        trips={savedTrips}
        onClose={() => setIsSavedOpen(false)}
        onSelectTrip={handleSelectSavedTrip}
        onDeleteTrip={handleDeleteTrip}
      />

      {/* Live Disruption Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        alerts={alerts}
        onClose={() => setIsAlertsOpen(false)}
      />
    </div>
  );
};

export default App;

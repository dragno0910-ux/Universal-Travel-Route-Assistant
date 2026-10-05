import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteOption, Place } from '../types/shared';

interface MapComponentProps {
  origin?: Place | null;
  destination?: Place | null;
  selectedRoute?: RouteOption | null;
  activeStepCoords?: [number, number] | null;
  onSelectCoords?: (lat: number, lng: number) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  origin,
  destination,
  selectedRoute,
  activeStepCoords,
  onSelectCoords
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const activeStepMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Mumbai (Airport to Gateway overview)
    const map = L.map(mapContainerRef.current, {
      center: [19.0300, 72.8550],
      zoom: 12,
      zoomControl: true
    });

    // Add CartoDB Positron clean tiles or OpenStreetMap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Map click handler to select point
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onSelectCoords) {
        onSelectCoords(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Origin Marker
    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-origin-icon',
        html: `<div style="
          background-color: #10b981;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.5);
          border: 3px solid white;
        ">A</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const m = L.marker([origin.lat, origin.lng], { icon: originIcon })
        .bindPopup(`<b>Origin:</b> ${origin.name}`)
        .addTo(markersGroup);
      bounds.extend([origin.lat, origin.lng]);
    }

    // 2. Destination Marker
    if (destination) {
      const destIcon = L.divIcon({
        className: 'custom-dest-icon',
        html: `<div style="
          background-color: #ef4444;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.5);
          border: 3px solid white;
        ">B</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const m = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .bindPopup(`<b>Destination:</b> ${destination.name}`)
        .addTo(markersGroup);
      bounds.extend([destination.lat, destination.lng]);
    }

    // 3. Polyline for selected route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (selectedRoute && selectedRoute.polyline && selectedRoute.polyline.length > 0) {
      const latlngs = selectedRoute.polyline.map(p => [p[0], p[1]] as [number, number]);
      
      const polyline = L.polyline(latlngs, {
        color: selectedRoute.tag === 'Cheapest' ? '#059669' : selectedRoute.tag === 'Comfort / Luggage' ? '#7c3aed' : '#2563eb',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      routeLayerRef.current = polyline;

      latlngs.forEach(ll => bounds.extend(ll));

      // Also place small transfer nodes if multiple transit legs
      if (selectedRoute.legs.length > 1) {
        selectedRoute.legs.forEach((leg, index) => {
          if (index > 0) {
            const transferIcon = L.divIcon({
              className: 'transfer-icon',
              html: `<div style="
                background: #ffffff;
                border: 2px solid #2563eb;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              "></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            L.marker(leg.startCoords, { icon: transferIcon })
              .bindPopup(`<b>Transfer point:</b> ${leg.fromName}`)
              .addTo(markersGroup);
          }
        });
      }
    }

    // Fit map bounds if points exist
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [origin, destination, selectedRoute]);

  // Active step pulsing marker in Navigation Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeStepMarkerRef.current) {
      activeStepMarkerRef.current.remove();
      activeStepMarkerRef.current = null;
    }

    if (activeStepCoords) {
      const pulseIcon = L.divIcon({
        className: 'nav-pulse-container',
        html: `<div class="nav-pulse-marker"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const m = L.marker(activeStepCoords, { icon: pulseIcon }).addTo(map);
      activeStepMarkerRef.current = m;
      map.panTo(activeStepCoords, { animate: true, duration: 0.8 });
    }
  }, [activeStepCoords]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} className="map-container" style={{ width: '100%', height: '100%' }} />

      {/* Recenter button */}
      <button
        onClick={() => {
          if (mapInstanceRef.current && routeLayerRef.current) {
            mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
          } else if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([19.0300, 72.8550], 12);
          }
        }}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 400,
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '0.45rem 0.75rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#334155',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        🎯 Recenter Route
      </button>
    </div>
  );
};

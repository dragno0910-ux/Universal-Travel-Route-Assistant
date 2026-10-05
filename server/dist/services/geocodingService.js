"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodingService = exports.GeocodingService = void 0;
const axios_1 = __importDefault(require("axios"));
const mumbaiTransitData_1 = require("./mumbaiTransitData");
const config_1 = require("../config");
class GeocodingService {
    /**
     * Search places by query string
     */
    async search(query, limit = 8) {
        if (!query || query.trim().length === 0) {
            return this.getPopularPlaces();
        }
        const cleanQuery = query.toLowerCase().trim();
        const results = [];
        // 1. Search local curated landmarks
        for (const lm of mumbaiTransitData_1.MUMBAI_LANDMARKS) {
            if (lm.name.toLowerCase().includes(cleanQuery) ||
                lm.displayName.toLowerCase().includes(cleanQuery) ||
                lm.type.toLowerCase().includes(cleanQuery)) {
                results.push(lm);
            }
        }
        // 2. Search local curated transit stations
        for (const st of mumbaiTransitData_1.MUMBAI_STATIONS) {
            if (st.name.toLowerCase().includes(cleanQuery) ||
                st.network.toLowerCase().includes(cleanQuery) ||
                st.line.toLowerCase().includes(cleanQuery)) {
                results.push({
                    id: `station_${st.id}`,
                    name: st.name,
                    displayName: `${st.name} (${st.network})`,
                    lat: st.lat,
                    lng: st.lng,
                    type: st.network.includes('Metro') ? 'metro_station' : 'railway_station',
                    city: 'Mumbai',
                    accessibility: st.accessible
                });
            }
        }
        // Deduplicate by name/location
        const seen = new Set();
        const deduplicated = results.filter(p => {
            const key = `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        if (deduplicated.length >= limit) {
            return deduplicated.slice(0, limit);
        }
        // 3. Fallback / Augment with OpenStreetMap Nominatim or Photon
        try {
            const osmPlaces = await this.queryOSMNominatim(cleanQuery, limit - deduplicated.length);
            for (const osm of osmPlaces) {
                const key = `${osm.lat.toFixed(4)}_${osm.lng.toFixed(4)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    deduplicated.push(osm);
                }
            }
        }
        catch (err) {
            // Nominatim might be rate-limited or offline; graceful fallback to local matches
            console.warn('OSM Nominatim search fallback error:', err.message);
        }
        return deduplicated.slice(0, limit);
    }
    /**
     * Reverse geocode coordinates to a Place name
     */
    async reverseGeocode(coords) {
        // 1. Check if it's very close to any known landmark or station (within 250m)
        const closest = this.findClosestKnownPlace(coords);
        if (closest && closest.distanceMeters < 250) {
            return closest.place;
        }
        // 2. Attempt online reverse geocode
        try {
            const response = await axios_1.default.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat: coords.lat,
                    lon: coords.lng,
                    format: 'json',
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'MumbaiTravelRouteAssistant/1.0'
                },
                timeout: 3000
            });
            if (response.data && response.data.display_name) {
                const parts = response.data.display_name.split(',');
                const shortName = parts.slice(0, 2).join(',').trim();
                return {
                    id: `rev_${coords.lat}_${coords.lng}`,
                    name: shortName || response.data.name || 'Selected Location',
                    displayName: response.data.display_name,
                    lat: coords.lat,
                    lng: coords.lng,
                    type: 'address',
                    city: response.data.address?.city || response.data.address?.state_district || 'Mumbai'
                };
            }
        }
        catch (err) {
            console.warn('Reverse geocode fallback:', err.message);
        }
        // 3. Return coordinate-based descriptor
        return {
            id: `coords_${coords.lat}_${coords.lng}`,
            name: closest ? `Near ${closest.place.name}` : `Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
            displayName: closest ? `Near ${closest.place.displayName}` : `Coordinates (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
            lat: coords.lat,
            lng: coords.lng,
            type: 'locality',
            city: 'Mumbai'
        };
    }
    /**
     * Return curated popular starting and destination places
     */
    getPopularPlaces() {
        return mumbaiTransitData_1.MUMBAI_LANDMARKS;
    }
    /**
     * Query OpenStreetMap Nominatim for places
     */
    async queryOSMNominatim(query, count) {
        const formattedQuery = query.includes('mumbai') ? query : `${query}, Mumbai`;
        const response = await axios_1.default.get(config_1.config.nominatimUrl, {
            params: {
                q: formattedQuery,
                format: 'json',
                limit: count,
                addressdetails: 1,
                countrycodes: 'in'
            },
            headers: {
                'User-Agent': 'MumbaiTravelRouteAssistant/1.0'
            },
            timeout: 3500
        });
        if (!Array.isArray(response.data))
            return [];
        return response.data.map((item, idx) => {
            const parts = (item.display_name || '').split(',');
            const shortTitle = parts.slice(0, 2).join(',').trim();
            return {
                id: `osm_${item.place_id || idx}`,
                name: shortTitle || item.name || query,
                displayName: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                type: this.categorizeOsmType(item.type, item.class),
                city: item.address?.city || item.address?.state_district || 'Mumbai',
                accessibility: item.extratags?.wheelchair === 'yes'
            };
        });
    }
    categorizeOsmType(type, osmClass) {
        if (osmClass === 'aeroway' || type === 'aerodrome')
            return 'airport';
        if (osmClass === 'railway' || type === 'station')
            return 'railway_station';
        if (osmClass === 'highway' && type === 'bus_stop')
            return 'bus_stop';
        if (osmClass === 'tourism' || osmClass === 'historic')
            return 'landmark';
        if (osmClass === 'commercial' || osmClass === 'shop')
            return 'commercial';
        return 'address';
    }
    /**
     * Spatial helper: Find closest known station or landmark
     */
    findClosestKnownPlace(coords) {
        let bestPlace = null;
        let minDistance = Infinity;
        const allCandidates = [
            ...mumbaiTransitData_1.MUMBAI_LANDMARKS,
            ...mumbaiTransitData_1.MUMBAI_STATIONS.map(s => ({
                id: `st_${s.id}`,
                name: s.name,
                displayName: `${s.name} (${s.network})`,
                lat: s.lat,
                lng: s.lng,
                type: s.network.includes('Metro') ? 'metro_station' : 'railway_station',
                city: 'Mumbai',
                accessibility: s.accessible
            }))
        ];
        for (const c of allCandidates) {
            const d = this.calculateHaversineDistanceMeters(coords.lat, coords.lng, c.lat, c.lng);
            if (d < minDistance) {
                minDistance = d;
                bestPlace = c;
            }
        }
        if (!bestPlace)
            return null;
        return { place: bestPlace, distanceMeters: minDistance };
    }
    calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
exports.GeocodingService = GeocodingService;
exports.geocodingService = new GeocodingService();

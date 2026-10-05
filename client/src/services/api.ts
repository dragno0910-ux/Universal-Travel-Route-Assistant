import axios from 'axios';
import {
  Place,
  RouteRequest,
  RouteCalculationResponse,
  RouteOption,
  NavigationSession,
  AIIntentExtractionResult,
  AIExplanationResult,
  SavedTrip,
  TravelPreferences,
  LiveDisruption,
  User
} from '../types/shared';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 12000
});

// Attach JWT token if stored
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('travel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Places & Geocoding
  async searchPlaces(q: string): Promise<Place[]> {
    const res = await client.get<{ places: Place[] }>(`/places/search?q=${encodeURIComponent(q)}`);
    return res.data.places;
  },

  async getPopularPlaces(): Promise<Place[]> {
    const res = await client.get<{ places: Place[] }>('/places/popular');
    return res.data.places;
  },

  async reverseGeocode(lat: number, lng: number): Promise<Place> {
    const res = await client.get<{ place: Place }>(`/places/reverse?lat=${lat}&lng=${lng}`);
    return res.data.place;
  },

  // Routes
  async calculateRoutes(request: RouteRequest): Promise<RouteCalculationResponse> {
    const res = await client.post<RouteCalculationResponse>('/routes', request);
    return res.data;
  },

  async getRouteById(id: string): Promise<any> {
    const res = await client.get(`/routes/${id}`);
    return res.data;
  },

  // "What Do I Do Now?" Navigation
  async startNavigation(route: RouteOption): Promise<NavigationSession> {
    const res = await client.post<{ session: NavigationSession }>('/navigation/start', { route });
    return res.data.session;
  },

  async getCurrentStep(sessionId: string): Promise<NavigationSession> {
    const res = await client.get<{ session: NavigationSession }>(`/navigation/${sessionId}/current-step`);
    return res.data.session;
  },

  async advanceStep(sessionId: string): Promise<NavigationSession> {
    const res = await client.post<{ session: NavigationSession }>(`/navigation/${sessionId}/advance`);
    return res.data.session;
  },

  async previousStep(sessionId: string): Promise<NavigationSession> {
    const res = await client.post<{ session: NavigationSession }>(`/navigation/${sessionId}/previous`);
    return res.data.session;
  },

  async cancelNavigation(sessionId: string): Promise<void> {
    await client.post(`/navigation/${sessionId}/cancel`);
  },

  // AI Assistant
  async extractIntent(prompt: string): Promise<AIIntentExtractionResult> {
    const res = await client.post<AIIntentExtractionResult>('/ai/travel-assistant', { prompt });
    return res.data;
  },

  async explainRoute(route: RouteOption, context?: string): Promise<AIExplanationResult> {
    const res = await client.post<AIExplanationResult>('/ai/explain', { route, context });
    return res.data;
  },

  async chatAssistant(message: string, activeRoute?: RouteOption): Promise<string> {
    const res = await client.post<{ reply: string }>('/ai/chat', { message, activeRoute });
    return res.data.reply;
  },

  // Saved Trips
  async getSavedTrips(): Promise<SavedTrip[]> {
    const res = await client.get<{ trips: SavedTrip[] }>('/trips');
    return res.data.trips;
  },

  async saveTrip(tripData: Partial<SavedTrip>): Promise<SavedTrip> {
    const res = await client.post<{ trip: SavedTrip }>('/trips/save', tripData);
    return res.data.trip;
  },

  async deleteTrip(tripId: string): Promise<void> {
    await client.delete(`/trips/${tripId}`);
  },

  // Transit & Alerts
  async getAlerts(): Promise<LiveDisruption[]> {
    const res = await client.get<{ alerts: LiveDisruption[] }>('/transit/alerts');
    return res.data.alerts;
  },

  async submitFeedback(routeId: string, rating: number, comment?: string): Promise<void> {
    await client.post('/feedback', { routeId, rating, comment });
  },

  // Auth & Preferences
  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const res = await client.post<{ user: User; token: string }>('/auth/register', { email, password, name });
    localStorage.setItem('travel_token', res.data.token);
    return res.data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await client.post<{ user: User; token: string }>('/auth/login', { email, password });
    localStorage.setItem('travel_token', res.data.token);
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await client.get<{ user: User }>('/auth/me');
    return res.data;
  },

  async savePreferences(preferences: TravelPreferences): Promise<TravelPreferences> {
    const res = await client.post<{ preferences: TravelPreferences }>('/route/preferences', preferences);
    return res.data.preferences;
  }
};

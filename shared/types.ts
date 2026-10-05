export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: 'airport' | 'railway_station' | 'metro_station' | 'bus_stop' | 'landmark' | 'commercial' | 'locality' | 'address';
  city: string;
  accessibility?: boolean;
}

export type TravelMode = 'walk' | 'metro' | 'train' | 'bus' | 'cab' | 'auto';

export interface TravelPreferences {
  maxBudgetINR?: number;
  arrivalDeadline?: string;
  maxWalkingMeters?: number;
  maxTransfers?: number;
  accessibilityRequired?: boolean;
  luggageFriendly?: boolean;
  modePreference?: TravelMode[];
  priority?: 'fastest' | 'cheapest' | 'least_walking' | 'comfort' | 'balanced';
}

export interface RouteRequest {
  origin: Coordinates & { name?: string };
  destination: Coordinates & { name?: string };
  preferences?: TravelPreferences;
}

export interface ItineraryLeg {
  id: string;
  mode: TravelMode;
  instruction: string;
  guidanceTip?: string; // High-value "what do I do now" life advice
  fromName: string;
  toName: string;
  startCoords: [number, number]; // [lat, lng]
  endCoords: [number, number]; // [lat, lng]
  distanceMeters: number;
  durationMinutes: number;
  costINR: number;
  lineName?: string;
  routeNumber?: string;
  platform?: string;
  numStops?: number;
  intermediateStops?: string[];
  geometry: [number, number][]; // Coordinates along the path [lat, lng]
  fareDetails?: {
    type: string;
    price: number;
    bookingMethod: string;
  };
  warningNotice?: string;
}

export interface RouteOption {
  id: string;
  title: string;
  tag: 'Recommended' | 'Fastest' | 'Cheapest' | 'Comfort / Luggage' | 'Direct Cab' | 'Walking';
  summary: string;
  durationMinutes: number;
  totalCostINR: number;
  totalDistanceMeters: number;
  walkingDistanceMeters: number;
  transfers: number;
  legs: ItineraryLeg[];
  polyline: [number, number][];
  accessibilityScore: number; // 0 - 100
  crowdLevel: 'Low' | 'Moderate' | 'Heavy (Peak Hours)';
  aiExplanation?: string;
}

export interface RouteCalculationResponse {
  routeRequestId: string;
  origin: Place;
  destination: Place;
  routes: RouteOption[];
  liveAlerts?: LiveDisruption[];
  generatedAt: string;
}

export interface NavigationSession {
  sessionId: string;
  routeId: string;
  currentLegIndex: number;
  totalLegs: number;
  status: 'active' | 'completed' | 'cancelled';
  currentLeg: ItineraryLeg;
  nextLeg?: ItineraryLeg;
  remainingMinutes: number;
  remainingDistanceMeters: number;
  progressPercent: number;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface AIIntentExtractionResult {
  extractedPreferences: TravelPreferences;
  originQuery?: string;
  destinationQuery?: string;
  recognizedIntent: string;
  confidence: number;
}

export interface AIExplanationResult {
  routeId: string;
  explanation: string;
  highlights: string[];
  firstTimeVisitorTips: string[];
  localProTips: string[];
}

export interface LiveDisruption {
  id: string;
  line: string;
  agency: 'Western Railway' | 'Central Railway' | 'Harbour Railway' | 'Mumbai Metro One' | 'Maha Mumbai Metro' | 'BEST Bus';
  severity: 'info' | 'warning' | 'alert';
  message: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: TravelPreferences;
  createdAt: string;
}

export interface SavedTrip {
  id: string;
  userId?: string;
  label: string;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  preferredMode: string;
  routeData: RouteOption;
  createdAt: string;
}

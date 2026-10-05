import fs from 'fs';
import path from 'path';
import { User, SavedTrip, TravelPreferences, RouteOption, LiveDisruption } from '../types/shared';
import { MUMBAI_LANDMARKS, MUMBAI_STATIONS } from '../services/mumbaiTransitData';

export interface DBFeedback {
  id: string;
  userId?: string;
  routeId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface StoredRouteResult {
  id: string;
  origin: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  preferences?: TravelPreferences;
  routes: RouteOption[];
  createdAt: string;
}

export interface DBData {
  users: (User & { passwordHash: string })[];
  userPreferences: Record<string, TravelPreferences>;
  savedTrips: SavedTrip[];
  routeHistory: StoredRouteResult[];
  feedback: DBFeedback[];
  liveAlerts: LiveDisruption[];
}

const DB_PATH = path.resolve(__dirname, '../../../database/travel_assistant.json');

const INITIAL_ALERTS: LiveDisruption[] = [
  {
    id: 'alt_wr_1',
    line: 'Western Railway',
    agency: 'Western Railway',
    severity: 'info',
    message: 'Fast & Slow local trains running normal on Churchgate-Borivali corridor.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'alt_m7_1',
    line: 'Metro Line 7 & 2A',
    agency: 'Maha Mumbai Metro',
    severity: 'info',
    message: 'Services operating smoothly with 6-minute frequency. Connects directly to Line 1 at Gundavali.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'alt_cr_1',
    line: 'Central Railway',
    agency: 'Central Railway',
    severity: 'warning',
    message: 'Suburban trains running with 5-7 min delay near Kurla due to cautionary track maintenance.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'alt_m3_1',
    line: 'Metro Line 3 (Aqua)',
    agency: 'Maha Mumbai Metro',
    severity: 'info',
    message: 'Underground Phase 1 (Aarey to BKC via Airport T2/T1) operational. Air-conditioned step-free travel.',
    updatedAt: new Date().toISOString()
  }
];

class Database {
  private data: DBData;

  constructor() {
    this.data = this.load();
  }

  private load(): DBData {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read existing DB file, initializing fresh store:', err);
    }

    const initial: DBData = {
      users: [],
      userPreferences: {},
      savedTrips: [],
      routeHistory: [],
      feedback: [],
      liveAlerts: INITIAL_ALERTS
    };
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DBData): void {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users ---
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  // --- Preferences ---
  public getUserPreferences(userId: string): TravelPreferences | undefined {
    return this.data.userPreferences[userId];
  }

  public saveUserPreferences(userId: string, preferences: TravelPreferences) {
    this.data.userPreferences[userId] = {
      ...this.data.userPreferences[userId],
      ...preferences
    };
    this.save();
    return this.data.userPreferences[userId];
  }

  // --- Saved Trips ---
  public getSavedTrips(userId?: string): SavedTrip[] {
    if (!userId) {
      return this.data.savedTrips;
    }
    return this.data.savedTrips.filter(t => !t.userId || t.userId === userId);
  }

  public saveTrip(trip: SavedTrip): SavedTrip {
    this.data.savedTrips.unshift(trip);
    this.save();
    return trip;
  }

  public deleteSavedTrip(tripId: string, userId?: string): boolean {
    const initialLen = this.data.savedTrips.length;
    this.data.savedTrips = this.data.savedTrips.filter(t => {
      if (t.id !== tripId) return true;
      if (userId && t.userId && t.userId !== userId) return true;
      return false;
    });
    const removed = this.data.savedTrips.length < initialLen;
    if (removed) this.save();
    return removed;
  }

  // --- Route History ---
  public saveRouteResult(result: StoredRouteResult): void {
    this.data.routeHistory.unshift(result);
    if (this.data.routeHistory.length > 100) {
      this.data.routeHistory = this.data.routeHistory.slice(0, 100);
    }
    this.save();
  }

  public getRouteResultById(id: string): StoredRouteResult | undefined {
    return this.data.routeHistory.find(r => r.id === id || r.routes.some(opt => opt.id === id));
  }

  // --- Feedback ---
  public addFeedback(fb: DBFeedback): DBFeedback {
    this.data.feedback.push(fb);
    this.save();
    return fb;
  }

  // --- Live Alerts ---
  public getLiveAlerts(): LiveDisruption[] {
    return this.data.liveAlerts;
  }

  // --- Spatial Helpers ---
  public getLandmarks() {
    return MUMBAI_LANDMARKS;
  }

  public getStations() {
    return MUMBAI_STATIONS;
  }
}

export const db = new Database();

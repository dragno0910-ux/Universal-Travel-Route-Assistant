"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mumbaiTransitData_1 = require("../services/mumbaiTransitData");
const DB_PATH = path_1.default.resolve(__dirname, '../../../database/travel_assistant.json');
const INITIAL_ALERTS = [
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
    data;
    constructor() {
        this.data = this.load();
    }
    load() {
        try {
            const dir = path_1.default.dirname(DB_PATH);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            if (fs_1.default.existsSync(DB_PATH)) {
                const raw = fs_1.default.readFileSync(DB_PATH, 'utf-8');
                return JSON.parse(raw);
            }
        }
        catch (err) {
            console.warn('Could not read existing DB file, initializing fresh store:', err);
        }
        const initial = {
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
    save(dataToSave) {
        try {
            const dir = path_1.default.dirname(DB_PATH);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            const data = dataToSave || this.data;
            fs_1.default.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Failed to write database file:', err);
        }
    }
    // --- Users ---
    findUserByEmail(email) {
        return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }
    findUserById(id) {
        return this.data.users.find(u => u.id === id);
    }
    createUser(user) {
        this.data.users.push(user);
        this.save();
        return user;
    }
    // --- Preferences ---
    getUserPreferences(userId) {
        return this.data.userPreferences[userId];
    }
    saveUserPreferences(userId, preferences) {
        this.data.userPreferences[userId] = {
            ...this.data.userPreferences[userId],
            ...preferences
        };
        this.save();
        return this.data.userPreferences[userId];
    }
    // --- Saved Trips ---
    getSavedTrips(userId) {
        if (!userId) {
            return this.data.savedTrips;
        }
        return this.data.savedTrips.filter(t => !t.userId || t.userId === userId);
    }
    saveTrip(trip) {
        this.data.savedTrips.unshift(trip);
        this.save();
        return trip;
    }
    deleteSavedTrip(tripId, userId) {
        const initialLen = this.data.savedTrips.length;
        this.data.savedTrips = this.data.savedTrips.filter(t => {
            if (t.id !== tripId)
                return true;
            if (userId && t.userId && t.userId !== userId)
                return true;
            return false;
        });
        const removed = this.data.savedTrips.length < initialLen;
        if (removed)
            this.save();
        return removed;
    }
    // --- Route History ---
    saveRouteResult(result) {
        this.data.routeHistory.unshift(result);
        if (this.data.routeHistory.length > 100) {
            this.data.routeHistory = this.data.routeHistory.slice(0, 100);
        }
        this.save();
    }
    getRouteResultById(id) {
        return this.data.routeHistory.find(r => r.id === id || r.routes.some(opt => opt.id === id));
    }
    // --- Feedback ---
    addFeedback(fb) {
        this.data.feedback.push(fb);
        this.save();
        return fb;
    }
    // --- Live Alerts ---
    getLiveAlerts() {
        return this.data.liveAlerts;
    }
    // --- Spatial Helpers ---
    getLandmarks() {
        return mumbaiTransitData_1.MUMBAI_LANDMARKS;
    }
    getStations() {
        return mumbaiTransitData_1.MUMBAI_STATIONS;
    }
}
exports.db = new Database();

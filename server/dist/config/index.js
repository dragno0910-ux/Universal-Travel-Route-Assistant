"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'mumbai-travel-assistant-super-secret-key-2026',
    jwtExpiresIn: '7d',
    // External APIs
    openRouteServiceApiKey: process.env.OPENROUTESERVICE_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    // Free public routing engines
    osrmCarUrl: 'https://router.project-osrm.org/route/v1/driving',
    osrmFootUrl: 'https://router.project-osrm.org/route/v1/foot',
    // Free geocoding engines
    nominatimUrl: 'https://nominatim.openstreetmap.org/search',
    photonUrl: 'https://photon.komoot.io/api',
    // Default coordinates: Mumbai Airport T2
    defaultOrigin: {
        lat: 19.0896,
        lng: 72.8656,
        name: 'Chhatrapati Shivaji Maharaj International Airport (T2)'
    },
    // Default destination: Gateway of India
    defaultDestination: {
        lat: 18.9220,
        lng: 72.8347,
        name: 'Gateway of India, Colaba'
    }
};

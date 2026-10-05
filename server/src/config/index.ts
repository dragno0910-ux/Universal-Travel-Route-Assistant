import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
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

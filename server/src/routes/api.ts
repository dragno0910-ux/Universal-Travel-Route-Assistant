import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database/db';
import { geocodingService } from '../services/geocodingService';
import { routeOrchestrator } from '../services/routeOrchestrator';
import { aiService } from '../services/aiService';
import { navigationService } from '../services/navigationService';
import { RouteRequest, SavedTrip, TravelPreferences } from '../types/shared';
import { requireAuth, optionalAuth, generateToken, AuthenticatedRequest } from '../middleware/auth';
import { MUMBAI_STATIONS } from '../services/mumbaiTransitData';

const router = Router();

// ==========================================
// 1. PLACES & GEOCODING ENDPOINTS
// ==========================================

router.get('/places/popular', (req: Request, res: Response) => {
  res.json({ places: geocodingService.getPopularPlaces() });
});

router.get('/places/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = parseInt((req.query.limit as string) || '8', 10);
    const results = await geocodingService.search(q, limit);
    res.json({ places: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search places', details: (err as Error).message });
  }
});

router.get('/places/reverse', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates provided' });
    }
    const place = await geocodingService.reverseGeocode({ lat, lng });
    res.json({ place });
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocode failed', details: (err as Error).message });
  }
});

// ==========================================
// 2. ROUTE ORCHESTRATION ENDPOINTS
// ==========================================

const RouteRequestSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional()
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional()
  }),
  preferences: z.object({
    maxBudgetINR: z.number().optional(),
    arrivalDeadline: z.string().optional(),
    maxWalkingMeters: z.number().optional(),
    maxTransfers: z.number().optional(),
    accessibilityRequired: z.boolean().optional(),
    luggageFriendly: z.boolean().optional(),
    modePreference: z.array(z.string()).optional(),
    priority: z.enum(['fastest', 'cheapest', 'least_walking', 'comfort', 'balanced']).optional()
  }).optional()
});

router.post('/routes', async (req: Request, res: Response) => {
  try {
    const parsed = RouteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid route request schema', issues: parsed.error.issues });
    }

    const calculationResult = await routeOrchestrator.computeRoutes(parsed.data as RouteRequest);
    res.json(calculationResult);
  } catch (err) {
    console.error('Route calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate route', details: (err as Error).message });
  }
});

router.get('/routes/:id', (req: Request, res: Response) => {
  const result = db.getRouteResultById(String(req.params.id));
  if (!result) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.json(result);
});

// ==========================================
// 3. STEP-BY-STEP "WHAT DO I DO NOW" NAVIGATION
// ==========================================

router.post('/navigation/start', (req: Request, res: Response) => {
  const { route } = req.body;
  if (!route || !Array.isArray(route.legs) || route.legs.length === 0) {
    return res.status(400).json({ error: 'Valid route object with legs required to start navigation' });
  }
  const session = navigationService.startNavigation(route);
  res.json({ session });
});

router.get('/navigation/:sessionId/current-step', (req: Request, res: Response) => {
  const session = navigationService.getCurrentStep(String(req.params.sessionId));
  if (!session) {
    return res.status(404).json({ error: 'Navigation session not found' });
  }
  res.json({ session });
});

router.post('/navigation/:sessionId/advance', (req: Request, res: Response) => {
  const session = navigationService.advanceStep(String(req.params.sessionId));
  if (!session) {
    return res.status(404).json({ error: 'Navigation session not found' });
  }
  res.json({ session });
});

router.post('/navigation/:sessionId/previous', (req: Request, res: Response) => {
  const session = navigationService.previousStep(String(req.params.sessionId));
  if (!session) {
    return res.status(404).json({ error: 'Navigation session not found' });
  }
  res.json({ session });
});

router.post('/navigation/:sessionId/cancel', (req: Request, res: Response) => {
  const success = navigationService.cancelNavigation(String(req.params.sessionId));
  res.json({ success });
});

// ==========================================
// 4. AI TRAVEL ASSISTANT ENDPOINTS
// ==========================================

router.post('/ai/travel-assistant', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt text required' });
    }
    const intentResult = await aiService.extractIntent(prompt);
    res.json(intentResult);
  } catch (err) {
    res.status(500).json({ error: 'AI Assistant failed to process request', details: (err as Error).message });
  }
});

router.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const { route, context } = req.body;
    if (!route) {
      return res.status(400).json({ error: 'Route object is required for AI explanation' });
    }
    const explanation = await aiService.explainRoute(route, context);
    res.json(explanation);
  } catch (err) {
    res.status(500).json({ error: 'AI explanation error', details: (err as Error).message });
  }
});

router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, activeRoute } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }
    const reply = await aiService.answerTravelQuestion(message, activeRoute);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'AI chat error', details: (err as Error).message });
  }
});

// ==========================================
// 5. AUTHENTICATION & USER PREFERENCES
// ==========================================

router.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = db.createUser({
    id: `usr_${Date.now()}`,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newUser);
  res.status(201).json({
    user: { id: newUser.id, email: newUser.email, name: newUser.name },
    token
  });
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  const preferences = db.getUserPreferences(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name, preferences },
    token
  });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const preferences = db.getUserPreferences(user.id);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, preferences }
  });
});

router.post('/route/preferences', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'guest_user';
  const updated = db.saveUserPreferences(userId, req.body as TravelPreferences);
  res.json({ preferences: updated });
});

router.get('/route/preferences', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'guest_user';
  const preferences = db.getUserPreferences(userId) || {};
  res.json({ preferences });
});

// ==========================================
// 6. SAVED TRIPS & HISTORY
// ==========================================

router.post('/trips/save', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { label, originName, destinationName, originCoords, destinationCoords, preferredMode, routeData } = req.body;
  if (!label || !routeData) {
    return res.status(400).json({ error: 'Trip label and routeData are required' });
  }

  const trip: SavedTrip = {
    id: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: req.user?.id,
    label,
    originName: originName || routeData.legs[0]?.fromName || 'Origin',
    destinationName: destinationName || routeData.legs[routeData.legs.length - 1]?.toName || 'Destination',
    originCoords: originCoords || routeData.legs[0]?.startCoords || [0, 0],
    destinationCoords: destinationCoords || routeData.legs[routeData.legs.length - 1]?.endCoords || [0, 0],
    preferredMode: preferredMode || routeData.tag,
    routeData,
    createdAt: new Date().toISOString()
  };

  const saved = db.saveTrip(trip);
  res.status(201).json({ trip: saved });
});

router.get('/trips', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const trips = db.getSavedTrips(req.user?.id);
  res.json({ trips });
});

router.delete('/trips/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteSavedTrip(String(req.params.id), req.user?.id);
  if (!success) {
    return res.status(404).json({ error: 'Trip not found or unauthorized' });
  }
  res.json({ success: true, message: 'Trip removed' });
});

// ==========================================
// 7. TRANSIT & FEEDBACK
// ==========================================

router.get('/transit/lines', (req: Request, res: Response) => {
  const linesMap: Record<string, { network: string; count: number; accessible: boolean }> = {};
  for (const st of MUMBAI_STATIONS) {
    if (!linesMap[st.line]) {
      linesMap[st.line] = { network: st.network, count: 0, accessible: true };
    }
    linesMap[st.line].count++;
    if (!st.accessible) linesMap[st.line].accessible = false;
  }
  res.json({ lines: linesMap });
});

router.get('/transit/alerts', (req: Request, res: Response) => {
  res.json({ alerts: db.getLiveAlerts() });
});

router.post('/feedback', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { routeId, rating, comment } = req.body;
  if (!routeId || typeof rating !== 'number') {
    return res.status(400).json({ error: 'routeId and numeric rating (1-5) required' });
  }

  const fb = db.addFeedback({
    id: `fb_${Date.now()}`,
    userId: req.user?.id,
    routeId,
    rating,
    comment: comment || '',
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ success: true, feedback: fb });
});

export default router;

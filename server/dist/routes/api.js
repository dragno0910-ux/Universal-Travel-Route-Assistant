"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const db_1 = require("../database/db");
const geocodingService_1 = require("../services/geocodingService");
const routeOrchestrator_1 = require("../services/routeOrchestrator");
const aiService_1 = require("../services/aiService");
const navigationService_1 = require("../services/navigationService");
const auth_1 = require("../middleware/auth");
const mumbaiTransitData_1 = require("../services/mumbaiTransitData");
const router = (0, express_1.Router)();
// ==========================================
// 1. PLACES & GEOCODING ENDPOINTS
// ==========================================
router.get('/places/popular', (req, res) => {
    res.json({ places: geocodingService_1.geocodingService.getPopularPlaces() });
});
router.get('/places/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const limit = parseInt(req.query.limit || '8', 10);
        const results = await geocodingService_1.geocodingService.search(q, limit);
        res.json({ places: results });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to search places', details: err.message });
    }
});
router.get('/places/reverse', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: 'Invalid coordinates provided' });
        }
        const place = await geocodingService_1.geocodingService.reverseGeocode({ lat, lng });
        res.json({ place });
    }
    catch (err) {
        res.status(500).json({ error: 'Reverse geocode failed', details: err.message });
    }
});
// ==========================================
// 2. ROUTE ORCHESTRATION ENDPOINTS
// ==========================================
const RouteRequestSchema = zod_1.z.object({
    origin: zod_1.z.object({
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
        name: zod_1.z.string().optional()
    }),
    destination: zod_1.z.object({
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
        name: zod_1.z.string().optional()
    }),
    preferences: zod_1.z.object({
        maxBudgetINR: zod_1.z.number().optional(),
        arrivalDeadline: zod_1.z.string().optional(),
        maxWalkingMeters: zod_1.z.number().optional(),
        maxTransfers: zod_1.z.number().optional(),
        accessibilityRequired: zod_1.z.boolean().optional(),
        luggageFriendly: zod_1.z.boolean().optional(),
        modePreference: zod_1.z.array(zod_1.z.string()).optional(),
        priority: zod_1.z.enum(['fastest', 'cheapest', 'least_walking', 'comfort', 'balanced']).optional()
    }).optional()
});
router.post('/routes', async (req, res) => {
    try {
        const parsed = RouteRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid route request schema', issues: parsed.error.issues });
        }
        const calculationResult = await routeOrchestrator_1.routeOrchestrator.computeRoutes(parsed.data);
        res.json(calculationResult);
    }
    catch (err) {
        console.error('Route calculation error:', err);
        res.status(500).json({ error: 'Failed to calculate route', details: err.message });
    }
});
router.get('/routes/:id', (req, res) => {
    const result = db_1.db.getRouteResultById(String(req.params.id));
    if (!result) {
        return res.status(404).json({ error: 'Route not found' });
    }
    res.json(result);
});
// ==========================================
// 3. STEP-BY-STEP "WHAT DO I DO NOW" NAVIGATION
// ==========================================
router.post('/navigation/start', (req, res) => {
    const { route } = req.body;
    if (!route || !Array.isArray(route.legs) || route.legs.length === 0) {
        return res.status(400).json({ error: 'Valid route object with legs required to start navigation' });
    }
    const session = navigationService_1.navigationService.startNavigation(route);
    res.json({ session });
});
router.get('/navigation/:sessionId/current-step', (req, res) => {
    const session = navigationService_1.navigationService.getCurrentStep(String(req.params.sessionId));
    if (!session) {
        return res.status(404).json({ error: 'Navigation session not found' });
    }
    res.json({ session });
});
router.post('/navigation/:sessionId/advance', (req, res) => {
    const session = navigationService_1.navigationService.advanceStep(String(req.params.sessionId));
    if (!session) {
        return res.status(404).json({ error: 'Navigation session not found' });
    }
    res.json({ session });
});
router.post('/navigation/:sessionId/previous', (req, res) => {
    const session = navigationService_1.navigationService.previousStep(String(req.params.sessionId));
    if (!session) {
        return res.status(404).json({ error: 'Navigation session not found' });
    }
    res.json({ session });
});
router.post('/navigation/:sessionId/cancel', (req, res) => {
    const success = navigationService_1.navigationService.cancelNavigation(String(req.params.sessionId));
    res.json({ success });
});
// ==========================================
// 4. AI TRAVEL ASSISTANT ENDPOINTS
// ==========================================
router.post('/ai/travel-assistant', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt text required' });
        }
        const intentResult = await aiService_1.aiService.extractIntent(prompt);
        res.json(intentResult);
    }
    catch (err) {
        res.status(500).json({ error: 'AI Assistant failed to process request', details: err.message });
    }
});
router.post('/ai/explain', async (req, res) => {
    try {
        const { route, context } = req.body;
        if (!route) {
            return res.status(400).json({ error: 'Route object is required for AI explanation' });
        }
        const explanation = await aiService_1.aiService.explainRoute(route, context);
        res.json(explanation);
    }
    catch (err) {
        res.status(500).json({ error: 'AI explanation error', details: err.message });
    }
});
router.post('/ai/chat', async (req, res) => {
    try {
        const { message, activeRoute } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }
        const reply = await aiService_1.aiService.answerTravelQuestion(message, activeRoute);
        res.json({ reply });
    }
    catch (err) {
        res.status(500).json({ error: 'AI chat error', details: err.message });
    }
});
// ==========================================
// 5. AUTHENTICATION & USER PREFERENCES
// ==========================================
router.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const existing = db_1.db.findUserByEmail(email);
    if (existing) {
        return res.status(409).json({ error: 'User with this email already exists' });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const newUser = db_1.db.createUser({
        id: `usr_${Date.now()}`,
        email,
        name,
        passwordHash,
        createdAt: new Date().toISOString()
    });
    const token = (0, auth_1.generateToken)(newUser);
    res.status(201).json({
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
        token
    });
});
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    const user = db_1.db.findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = (0, auth_1.generateToken)(user);
    const preferences = db_1.db.getUserPreferences(user.id);
    res.json({
        user: { id: user.id, email: user.email, name: user.name, preferences },
        token
    });
});
router.get('/auth/me', auth_1.requireAuth, (req, res) => {
    const user = db_1.db.findUserById(req.user.id);
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    const preferences = db_1.db.getUserPreferences(user.id);
    res.json({
        user: { id: user.id, email: user.email, name: user.name, preferences }
    });
});
router.post('/route/preferences', auth_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'guest_user';
    const updated = db_1.db.saveUserPreferences(userId, req.body);
    res.json({ preferences: updated });
});
router.get('/route/preferences', auth_1.optionalAuth, (req, res) => {
    const userId = req.user?.id || 'guest_user';
    const preferences = db_1.db.getUserPreferences(userId) || {};
    res.json({ preferences });
});
// ==========================================
// 6. SAVED TRIPS & HISTORY
// ==========================================
router.post('/trips/save', auth_1.optionalAuth, (req, res) => {
    const { label, originName, destinationName, originCoords, destinationCoords, preferredMode, routeData } = req.body;
    if (!label || !routeData) {
        return res.status(400).json({ error: 'Trip label and routeData are required' });
    }
    const trip = {
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
    const saved = db_1.db.saveTrip(trip);
    res.status(201).json({ trip: saved });
});
router.get('/trips', auth_1.optionalAuth, (req, res) => {
    const trips = db_1.db.getSavedTrips(req.user?.id);
    res.json({ trips });
});
router.delete('/trips/:id', auth_1.optionalAuth, (req, res) => {
    const success = db_1.db.deleteSavedTrip(String(req.params.id), req.user?.id);
    if (!success) {
        return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }
    res.json({ success: true, message: 'Trip removed' });
});
// ==========================================
// 7. TRANSIT & FEEDBACK
// ==========================================
router.get('/transit/lines', (req, res) => {
    const linesMap = {};
    for (const st of mumbaiTransitData_1.MUMBAI_STATIONS) {
        if (!linesMap[st.line]) {
            linesMap[st.line] = { network: st.network, count: 0, accessible: true };
        }
        linesMap[st.line].count++;
        if (!st.accessible)
            linesMap[st.line].accessible = false;
    }
    res.json({ lines: linesMap });
});
router.get('/transit/alerts', (req, res) => {
    res.json({ alerts: db_1.db.getLiveAlerts() });
});
router.post('/feedback', auth_1.optionalAuth, (req, res) => {
    const { routeId, rating, comment } = req.body;
    if (!routeId || typeof rating !== 'number') {
        return res.status(400).json({ error: 'routeId and numeric rating (1-5) required' });
    }
    const fb = db_1.db.addFeedback({
        id: `fb_${Date.now()}`,
        userId: req.user?.id,
        routeId,
        rating,
        comment: comment || '',
        createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, feedback: fb });
});
exports.default = router;

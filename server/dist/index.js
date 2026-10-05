"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const api_1 = __importDefault(require("./routes/api"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging (sanitized, no sensitive passwords/keys)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path !== '/health') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});
// Health check endpoint (Phase 2 & Roadmap requirements)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Universal Travel & Route Assistant API',
        city: 'Mumbai',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        features: {
            geocoding: true,
            routeOrchestrator: true,
            mumbaiTransit: true,
            whatDoIDoNowNavigation: true,
            aiAssistant: true,
            auth: true,
            savedTrips: true
        }
    });
});
// Mount API routes
app.use('/api', api_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Centralized error handling
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});
// Start Server
const server = app.listen(config_1.config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Mumbai Travel & Route Assistant Server is RUNNING!`);
    console.log(`📍 Listening on: http://localhost:${config_1.config.port}`);
    console.log(`🔍 Health check: http://localhost:${config_1.config.port}/health`);
    console.log(`🚦 Mode: ${config_1.config.nodeEnv}`);
    console.log(`=======================================================`);
});
exports.default = app;

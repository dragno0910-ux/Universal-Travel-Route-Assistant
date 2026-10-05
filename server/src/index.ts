import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import apiRoutes from './routes/api';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (sanitized, no sensitive passwords/keys)
app.use((req: Request, res: Response, next: NextFunction) => {
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
app.get('/health', (req: Request, res: Response) => {
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
app.use('/api', apiRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Mumbai Travel & Route Assistant Server is RUNNING!`);
  console.log(`📍 Listening on: http://localhost:${config.port}`);
  console.log(`🔍 Health check: http://localhost:${config.port}/health`);
  console.log(`🚦 Mode: ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

export default app;

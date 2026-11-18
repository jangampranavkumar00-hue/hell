// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB (runs schema creation on import)
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Middleware ----------
app.use(cors());                      // Allow Vite dev server (localhost:5173) to call API
app.use(express.json());              // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Simple request logger (helpful during hackathon demos)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------- Routes ----------
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/queue', require('./routes/queue'));

// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  try {
    const doctorCount = db.prepare('SELECT COUNT(*) c FROM doctors').get().c;
    const tokenCount = db.prepare('SELECT COUNT(*) c FROM tokens').get().c;
    res.json({
      ok: true,
      uptime: process.uptime(),
      doctors: doctorCount,
      tokens: tokenCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------- Root ----------
app.get('/', (_req, res) => {
  res.json({
    name: 'DocDash API',
    version: '1.0.0',
    endpoints: {
      doctors: '/api/doctors?specialty=&clinic=',
      specialties: '/api/doctors/specialties',
      clinics: '/api/doctors/clinics',
      bookToken: 'POST /api/tokens',
      token: 'GET /api/tokens/:id',
      liveQueue: 'GET /api/queue/:doctorId',
      callNext: 'POST /api/queue/:doctorId/next',
      skipToken: 'POST /api/queue/:doctorId/skip/:tokenId',
      delay: 'POST /api/queue/:doctorId/delay  { minutes: 10 }',
      emergency: 'POST /api/queue/:doctorId/emergency',
      health: '/api/health',
    },
  });
});

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// ---------- Global error handler ----------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ---------- Start server ----------
const server = app.listen(PORT, () => {
  console.log(`✅ DocDash API running at http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/api/health`);
  console.log(`   Directory: http://localhost:${PORT}/api/doctors`);
});

// ---------- Graceful shutdown ----------
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
});

module.exports = app;
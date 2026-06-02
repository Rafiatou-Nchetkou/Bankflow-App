// server.js - API bancaire sécurisée
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

const app = express();

// ===== SÉCURITÉ OWASP =====

// 1. Headers de sécurité (Helmet)
app.use(helmet());

// 2. Rate Limiting (anti brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // maximum 100 requêtes par IP
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});
app.use('/api', limiter);

// 3. CORS sécurisé
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// 4. Protection XSS
app.use(xss());

// 5. Protection contre les paramètres pollués
app.use(hpp());

// 6. Compression
app.use(compression());

// 7. Parse JSON avec limite
app.use(express.json({ limit: '10kb' }));

// ===== ROUTES DE TEST =====

// Route publique
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur BankFlow API', status: 'OK' });
});

// Route de test avec rate limiting
app.get('/api/test', (req, res) => {
  res.json({ message: 'API fonctionne correctement !', timestamp: new Date() });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// ===== DÉMARRAGE DU SERVEUR =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 http://localhost:${PORT}`);
});
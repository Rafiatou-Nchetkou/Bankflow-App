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

// ===== DONNÉES SIMULÉES (en attendant la base de données) =====

// Statistiques simulées
const mockStats = {
  totalVolume: 1254800,
  activeUsers: 342,
  transactionsCount: 1256,
  securityAlerts: 3,
  transactionTrend: [
    { date: '2026-05-26', amount: 125000 },
    { date: '2026-05-27', amount: 142000 },
    { date: '2026-05-28', amount: 138000 },
    { date: '2026-05-29', amount: 156000 },
    { date: '2026-05-30', amount: 189000 },
    { date: '2026-05-31', amount: 210000 },
    { date: '2026-06-01', amount: 195000 },
  ],
  servicePerformance: [
    { service: 'Virements', usage: 450 },
    { service: 'Paiements', usage: 380 },
    { service: 'Dépôts', usage: 290 },
    { service: 'Retraits', usage: 136 },
  ]
};

// Transactions simulées
const mockTransactions = [
  { id: 'TRX-001', amount: 12500, status: 'completed', date: '2026-06-02T10:30:00Z', description: 'Virement bancaire' },
  { id: 'TRX-002', amount: 3500, status: 'completed', date: '2026-06-02T09:15:00Z', description: 'Paiement fournisseur' },
  { id: 'TRX-003', amount: 890, status: 'pending', date: '2026-06-01T16:45:00Z', description: 'Abonnement SaaS' },
  { id: 'TRX-004', amount: 12600, status: 'completed', date: '2026-06-01T11:20:00Z', description: 'Dépôt client' },
  { id: 'TRX-005', amount: 250, status: 'failed', date: '2026-05-31T14:10:00Z', description: 'Paiement rejeté' },
  { id: 'TRX-006', amount: 5400, status: 'completed', date: '2026-05-31T08:30:00Z', description: 'Facture mensuelle' },
  { id: 'TRX-007', amount: 3200, status: 'completed', date: '2026-05-30T17:00:00Z', description: 'Virement externe' },
];

// ===== ROUTES API =====

// Route publique de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur BankFlow API', status: 'OK' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// === ROUTES PROTÉGÉES (avec authentification - sera ajoutée plus tard) ===

// GET /api/dashboard/stats - Récupérer les statistiques
app.get('/api/dashboard/stats', (req, res) => {
  res.json(mockStats);
});

// GET /api/transactions/recent - Récupérer les transactions récentes
app.get('/api/transactions/recent', (req, res) => {
  // Limite aux 10 dernières transactions
  const recentTransactions = mockTransactions.slice(0, 10);
  res.json(recentTransactions);
});

// GET /api/transactions - Toutes les transactions
app.get('/api/transactions', (req, res) => {
  res.json(mockTransactions);
});

// POST /api/auth/login - Endpoint de connexion (à compléter)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Version temporaire - à remplacer par une vraie authentification
  if (email === 'admin@bankflow.com' && password === 'admin123') {
    res.json({
      success: true,
      user: { id: 1, email: 'admin@bankflow.com', roles: ['ADMIN', 'USER'] }
    });
  } else {
    res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
});

// ===== DÉMARRAGE DU SERVEUR =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🔒 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📊 API Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`💰 API Transactions: http://localhost:${PORT}/api/transactions/recent`);
});
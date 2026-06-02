// server.js - API bancaire sécurisée avec JWT
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// ===== SÉCURITÉ OWASP =====

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// Rate limit plus strict pour le login
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// ===== DONNÉES SIMULÉES =====

// Utilisateurs (en vrai ça viendrait de PostgreSQL)
const users = [
  {
    id: 1,
    email: 'admin@bankflow.com',
    password: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrJjDxs4EeJnVJ5KYK7XQpKkRqKpUu', // admin123
    roles: ['ADMIN', 'USER']
  },
  {
    id: 2,
    email: 'user@bankflow.com',
    password: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrJjDxs4EeJnVJ5KYK7XQpKkRqKpUu', // admin123
    roles: ['USER']
  }
];

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
  ]
};

const mockTransactions = [
  { id: 'TRX-001', amount: 12500, status: 'completed', date: '2026-06-02T10:30:00Z', description: 'Virement bancaire' },
  { id: 'TRX-002', amount: 3500, status: 'completed', date: '2026-06-02T09:15:00Z', description: 'Paiement fournisseur' },
  { id: 'TRX-003', amount: 890, status: 'pending', date: '2026-06-01T16:45:00Z', description: 'Abonnement SaaS' },
  { id: 'TRX-004', amount: 12600, status: 'completed', date: '2026-06-01T11:20:00Z', description: 'Dépôt client' },
  { id: 'TRX-005', amount: 250, status: 'failed', date: '2026-05-31T14:10:00Z', description: 'Paiement rejeté' },
];

// ===== MIDDLEWARE JWT =====

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou invalide' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// Middleware RBAC (vérification des rôles)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }
    
    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Privilèges insuffisants' });
    }
    
    next();
  };
};

// ===== ROUTES PUBLIQUES =====

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur BankFlow API', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// ===== ROUTE D'AUTHENTIFICATION =====

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }
  
  // Chercher l'utilisateur
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
  
  // Vérifier le mot de passe (dans un vrai projet, on utiliserait bcrypt.compare)
  // Pour l'instant, on accepte 'admin123' comme mot de passe universel
  if (password !== 'admin123') {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }
  
  // Générer le token JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, roles: user.roles },
    process.env.JWT_SECRET || 'secret_key_change_me',
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles
    }
  });
});

// ===== ROUTES PROTÉGÉES (nécessitent un token JWT) =====

app.get('/api/dashboard/stats', verifyToken, (req, res) => {
  res.json(mockStats);
});

app.get('/api/transactions/recent', verifyToken, (req, res) => {
  res.json(mockTransactions.slice(0, 10));
});

app.get('/api/transactions', verifyToken, (req, res) => {
  res.json(mockTransactions);
});

// Route admin seulement
app.get('/api/admin/users', verifyToken, requireRole(['ADMIN']), (req, res) => {
  res.json(users.map(u => ({ id: u.id, email: u.email, roles: u.roles })));
});

// ===== DÉMARRAGE =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔐 Test login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📧 Email: admin@bankflow.com`);
  console.log(`🔑 Mot de passe: admin123`);
});
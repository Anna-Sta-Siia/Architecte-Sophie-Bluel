require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const swaggerDocs = yaml.load(path.join(__dirname, 'swagger.yaml'));
const app = express();

/* ===== CORS ===== */
// Domaines “prod” autorisés (Render) ; fallback pour le dev
const DEFAULT_ORIGINS = [
  'https://anna-sta-siia.github.io', // GH Pages
  'http://localhost:5173',
  'http://localhost:5678',
];
const ALLOWED = new Set(
  (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);
// Autoriser automatiquement *tous* les localhost/127.0.0.1 (quel que soit le port)
const isLocal = origin => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);            // curl/postman/SSR
    if (isLocal(origin)) return cb(null, true);    // dev local
    if (ALLOWED.has(origin)) return cb(null, true);// prod autorisée
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors()); // préflight

/* ===== parsers + sécurité ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ crossOriginResourcePolicy: false })); // pour /images

/* ===== static ===== */
app.use('/images', express.static(path.join(__dirname, 'images')));

/* ===== health-check ===== */
// Route santé JSON pour scripts/moniteurs
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});
// Alias legacy (si tu en as besoin)
app.get('/health', (_req, res) => res.status(200).send('ok'));

// (Optionnel) petit message sur /
app.get('/', (_req, res) => {
  res.type('text').send('API Sophie Bluel is running. Try /api/health or /api/works');
});

/* ===== API routes ===== */
const db = require('./models');
const userRoutes = require('./routes/user.routes');
const categoriesRoutes = require('./routes/categories.routes');
const worksRoutes = require('./routes/works.routes');

db.sequelize.sync().then(() => console.log('db ready'));

app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/works', worksRoutes);

/* ===== Swagger ===== */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;

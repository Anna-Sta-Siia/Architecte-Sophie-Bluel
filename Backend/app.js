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
// Domaines “prod” autorisés (Render) ; on garde un fallback pour le dev
const DEFAULT_ORIGINS = [
  'https://anna-sta-siia.github.io', // ton GH Pages
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
const isLocal = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(
  cors({
    origin(origin, cb) {
      // Requêtes sans origin (curl, SSR, tests)
      if (!origin) return cb(null, true);
      // Local dev accepté
      if (isLocal(origin)) return cb(null, true);
      // Origines “prod” autorisées via env
      if (ALLOWED.has(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// Préflight
app.options('*', cors());

/* ===== parsers + sécurité ===== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ crossOriginResourcePolicy: false })); // pour /images

/* ===== static ===== */
app.use('/images', express.static(path.join(__dirname, 'images')));

/* ===== health-check ===== */
app.get('/health', (_req, res) => res.status(200).send('ok'));

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

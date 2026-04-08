require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// BUG FIX 1: Body size limit — Express has no default cap on JSON payloads.
// Without this, a large request body can hang or crash the server.
app.use(express.json({ limit: '10kb' }));

// BUG FIX 2: CORS was configured with cors() and no options, which allows ANY
// origin to call the API. Restricting to the local frontend by default.
// Change ALLOWED_ORIGIN in .env for production deployment.
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// BUG FIX 3: express-rate-limit was listed as a dependency in package.json but
// was NEVER imported or used anywhere in the codebase. Auth endpoints were
// completely unprotected from brute-force password attacks.
// Applied tighter limits on auth and a general limit on all other routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// Route files
const auth = require('./routes/auth');
const screening = require('./routes/screening');
const chat = require('./routes/chat');
const appointments = require('./routes/appointments');
const mood = require('./routes/mood');
const journal = require('./routes/journal');
const forum = require('./routes/forum');
const admin = require('./routes/admin');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/screening', screening);
app.use('/api/chat', chat);
app.use('/api/appointments', appointments);
app.use('/api/mood', mood);
app.use('/api/journal', journal);
app.use('/api/forum', forum);
app.use('/api/admin', admin);

app.get('/', (req, res) => res.json({ message: 'Mental Health App API Running' }));

// BUG FIX 4: No global error handler existed. Unhandled errors in Express 5
// are forwarded automatically to error middleware, but without a handler they
// produce an unhelpful default response. This catches anything that slips through.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let uri;

    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1')) {
      // Production / staging: use the real MongoDB URI from .env
      uri = process.env.MONGO_URI;
      await mongoose.connect(uri);
      console.log('MongoDB connected:', uri.replace(/:\/\/.*@/, '://***@')); // hide credentials in log
    } else {
      // Development fallback: use in-memory server if no real URI is provided
      // WARNING: all data is lost when the server restarts in this mode
      console.warn('[DEV] No persistent MONGO_URI set — using in-memory MongoDB. Data will not survive restarts.');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB Memory Server connected (development only)');
    }

    app.listen(PORT, () =>
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    );
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

startServer();

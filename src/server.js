require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const requestDeduplication = require('./middlewares/requestDeduplication');
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN?.split(',') || false
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));

// Request deduplication middleware - prevent duplicate simultaneous requests
// app.use(require('./middlewares/requestDeduplication'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Auth rate limiter - exclude /me endpoint from strict rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many auth attempts, please try again later.' },
  skip: (req) => req.path === '/me',
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/preferences', preferenceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Sensoria server running on port ${PORT}`);
});
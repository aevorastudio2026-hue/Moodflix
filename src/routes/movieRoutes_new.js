const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getAllMovies, getMovieById, getRecommendedMovies, getPersonalizedRecommendations } = require('../controllers/movieController');

const router = express.Router();

// ETag middleware for conditional requests
function etagMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function(data) {
    const body = JSON.stringify(data);
    const etag = require('crypto').createHash('md5').update(body).digest('hex');
    res.setHeader('ETag', etag);
    
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }
    
    return originalJson.call(this, data);
  };
  next();
}

const router = express.Router();

router.get('/', etagMiddleware, getAllMovies);
router.get('/recommend/mood', etagMiddleware, getRecommendedMovies);
router.get('/recommend/personalized', authMiddleware, etagMiddleware, getPersonalizedRecommendations);
router.get('/:id', etagMiddleware, getMovieById);

module.exports = router;
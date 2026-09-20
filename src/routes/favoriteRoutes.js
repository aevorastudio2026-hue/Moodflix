const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { addFavorite, removeFavorite, getUserFavorites } = require('../controllers/favoriteController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', addFavorite);
router.delete('/:movieId', removeFavorite);
router.get('/', getUserFavorites);

module.exports = router;
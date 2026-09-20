const { PrismaClient } = require('@prisma/client');
const prisma = require('../utils/prisma');
const tmdbService = require('../services/tmdbService');

async function addFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ success: false, message: 'movieId is required' });
    }

    // Handle TMDb movie IDs (format: tmdb-{id})
    let movie = await prisma.movie.findUnique({ where: { id: movieId } });
    
    // If not found locally, try to fetch from TMDb and create local entry
    if (!movie && movieId.startsWith('tmdb-')) {
      const tmdbId = movieId.replace('tmdb-', '');
      try {
        const tmdbMovie = await tmdbService.getMovieById(movieId);
        if (tmdbMovie) {
          movie = await prisma.movie.create({
            data: {
              id: movieId,
              title: tmdbMovie.title,
              genre: tmdbMovie.genre,
              mood: tmdbMovie.mood,
              rating: tmdbMovie.rating,
              releaseYear: tmdbMovie.releaseYear,
              description: tmdbMovie.description,
              posterUrl: tmdbMovie.posterUrl
            }
          });
        }
      } catch (tmdbError) {
        console.error('Failed to fetch movie from TMDb:', tmdbError.message);
      }
    }
    
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId: movie.id } },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Movie already in favorites' });
    }

    const favorite = await prisma.favorite.create({
      data: { userId, movieId: movie.id },
      include: { movie: true },
    });

    res.status(201).json({ success: true, message: 'Added to favorites', favorite });
  } catch (error) {
    console.error('addFavorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function removeFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { movieId } = req.params;

    // Handle TMDb movie IDs
    let actualMovieId = movieId;
    if (movieId.startsWith('tmdb-')) {
      const movie = await prisma.movie.findUnique({ where: { id: movieId } });
      if (movie) {
        actualMovieId = movie.id;
      }
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_movieId: { userId, movieId: actualMovieId } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Movie not in favorites' });
    }

    await prisma.favorite.delete({
      where: { userId_movieId: { userId, movieId: actualMovieId } },
    });

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('removeFavorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getUserFavorites(req, res) {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, favorites });
  } catch (error) {
    console.error('getUserFavorites error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { addFavorite, removeFavorite, getUserFavorites };
const tmdbService = require('../services/tmdbService');
const prisma = require('../utils/prisma');

// Simple in-memory cache for personalized recommendations (user-specific, 5 min TTL)
const CACHE_TTL_MS = 5 * 60 * 1000;
const personalizedCache = new Map();

function parseMoods(query) {
  if (query.moods) {
    return query.moods.split(',').map(m => m.trim()).filter(Boolean);
  }
  if (query.mood) {
    return [query.mood.trim()];
  }
  return [];
}

exports.getAllMovies = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // English mood mapping for TMDB service
    const ENGLISH_MOOD_MAP = {
      'Exciting': 'Exciting',
      'Fun': 'Fun',
      'Dramatic': 'Dramatic',
      'Scary': 'Scary',
      'Mind-bending': 'Mind-Bending',
      'Inspiring': 'Inspiring',
      'Intense': 'Intense',
      'Captivating': 'Mesmerizing',
      'Nostalgic': 'Nostalgic',
      'Chill': 'Easy Watch',
      'Tearjerker': 'Tearjerker',
      'Motivational': 'Motivational',
      'Late Night': 'Late Night',
      'Suspenseful': 'Suspenseful',
      'Epic': 'Epic'
    };

    const { search, genre, mood, moods } = req.query;
    
    if (genre) {
      const genreResult = await tmdbService.getMoviesByGenre(genre, req.query.page || 1);
      return res.json({
        success: true,
        count: genreResult.movies.length,
        data: genreResult.movies,
        pagination: {
          page: genreResult.page,
          limit: parseInt(limit),
          total: genreResult.total,
          totalPages: genreResult.totalPages,
        },
      });
    }

    if (req.query.mood || req.query.moods) {
      const moodList = req.query.moods ? req.query.moods.split(',').map(m => m.trim()) : [req.query.mood];
      // Map English mood names to TMDB service mood names
      const englishMood = moodList.map(m => ENGLISH_MOOD_MAP[m] || m)[0];
      const moodResult = await tmdbService.getMoviesByMood(englishMood, req.query.page || 1);
      return res.json({
        success: true,
        count: moodResult.movies.length,
        data: moodResult.movies,
        pagination: {
          page: moodResult.page,
          limit: parseInt(req.query.limit) || 12,
          total: moodResult.total,
          totalPages: moodResult.totalPages,
        },
      });
    }

    if (req.query.search) {
      const searchResult = await tmdbService.searchMovies(req.query.search, req.query.page || 1);
      return res.json({
        success: true,
        count: searchResult.movies.length,
        data: searchResult.movies,
        pagination: {
          page: searchResult.page,
          limit: parseInt(limit),
          total: searchResult.total,
          totalPages: searchResult.totalPages,
        },
      });
    }

    const popularResult = await tmdbService.getPopularMovies(parseInt(req.query.page) || 1);
    return res.json({
      success: true,
      count: popularResult.movies.length,
      data: popularResult.movies,
      pagination: {
        page: popularResult.page,
        limit: parseInt(limit),
        total: popularResult.total,
        totalPages: popularResult.totalPages,
      },
    });
  } catch (error) {
    console.error('Get movies error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMovieById = async (req, res) => {
  try {
    const movie = await tmdbService.getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    // Ensure description is never null/undefined
    if (!movie.description || movie.description.trim() === '') {
      movie.description = 'No description available in English.';
    }
    return res.json({ success: true, data: movie });
  } catch (error) {
    console.error('Get movie by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecommendedMovies = async (req, res) => {
  try {
    // English mood mapping for TMDB service
    const ENGLISH_MOOD_MAP = {
      'Exciting': 'Exciting',
      'Fun': 'Fun',
      'Dramatic': 'Dramatic',
      'Scary': 'Scary',
      'Mind-bending': 'Mind-Bending',
      'Inspiring': 'Inspiring',
      'Intense': 'Intense',
      'Captivating': 'Mesmerizing',
      'Nostalgic': 'Nostalgic',
      'Chill': 'Easy Watch',
      'Tearjerker': 'Tearjerker',
      'Motivational': 'Motivational',
      'Late Night': 'Late Night',
      'Suspenseful': 'Suspenseful',
      'Epic': 'Epic'
    };

    const moodList = [];
    if (req.query.mood) {
      moodList.push(req.query.mood);
    }
    if (req.query.moods) {
      moodList.push(...req.query.moods.split(',').map(m => m.trim()).filter(Boolean));
    }

    if (moodList.length > 0) {
      // Map English mood names to TMDB service mood names
      const englishMood = moodList.map(m => ENGLISH_MOOD_MAP[m] || m)[0];
      const result = await tmdbService.getMoviesByMood(englishMood, 1);
      return res.json({ success: true, data: result.movies });
    }

    const popularMovies = await tmdbService.getPopularMoviesForRecommendations();
    return res.json({ success: true, data: popularMovies.slice(0, 20) });
  } catch (error) {
    console.error('Recommended movies error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mood display labels (English UI labels for English mood values)
const MOOD_LABELS = {
  'Exciting': 'Exciting',
  'Fun': 'Fun',
  'Dramatic': 'Dramatic',
  'Scary': 'Scary',
  'Mind-bending': 'Mind-bending',
  'Inspiring': 'Inspiring',
  'Intense': 'Intense',
  'Captivating': 'Captivating',
  'Nostalgic': 'Nostalgic',
  'Chill': 'Chill',
  'Tearjerker': 'Tearjerker',
  'Motivational': 'Motivational',
  'Late Night': 'Late Night',
  'Suspenseful': 'Suspenseful',
  'Epic': 'Epic'
};

// Personalized recommendations (still uses Prisma for user preferences)

function normalizeText(text) {
  return text.toLowerCase()
    .trim();
}

function checkKeywordMatch(movieText, keywords) {
  if (!keywords || keywords.length === 0) return false;
  const normalizedText = normalizeText(movieText);
  return keywords.some(kw => {
    const normKw = normalizeText(kw);
    if (normalizedText.includes(normKw)) return true;
    return false;
  });
}

function calculatePersonalizationScore(movie, preferences) {
  let score = 0;
  const { likedGenres, dislikedGenres, likedMoods, dislikedMoods, likedKeywords, dislikedKeywords } = preferences;

  if (likedGenres && likedGenres.length > 0 && likedGenres.includes(movie.genre)) {
    score += 5;
  }

  if (dislikedGenres && dislikedGenres.length > 0 && dislikedGenres.includes(movie.genre)) {
    score -= 6;
  }

  if (likedMoods && likedMoods.length > 0 && likedMoods.includes(movie.mood)) {
    score += 5;
  }

  if (dislikedMoods && dislikedMoods.length > 0 && dislikedMoods.includes(movie.mood)) {
    score -= 6;
  }

  if (likedKeywords && likedKeywords.length > 0) {
    const movieText = `${movie.title} ${movie.description} ${movie.genre} ${movie.mood}`;
    const hasMatch = checkKeywordMatch(movieText, likedKeywords);
    if (hasMatch) {
      score += 2;
    }
  }

  if (dislikedKeywords && dislikedKeywords.length > 0) {
    const movieText = `${movie.title} ${movie.description} ${movie.genre} ${movie.mood}`;
    const hasMatch = checkKeywordMatch(movieText, dislikedKeywords);
    if (hasMatch) {
      score -= 3;
    }
  }

  score += movie.rating * 0.5;

  return score;
}

function getRecommendationReasons(movie, preferences) {
  const reasons = [];
  const { likedGenres, dislikedGenres, likedMoods, dislikedMoods, likedKeywords, dislikedKeywords } = preferences;

  if (likedGenres && likedGenres.length > 0 && likedGenres.includes(movie.genre)) {
    reasons.push(`Favorite genre: ${movie.genre}`);
  }

  if (likedMoods && likedMoods.length > 0 && likedMoods.includes(movie.mood)) {
    reasons.push(`Favorite mood: ${MOOD_LABELS[movie.mood] || movie.mood}`);
  }

  if (likedKeywords && likedKeywords.length > 0) {
    const movieText = `${movie.title} ${movie.description} ${movie.genre} ${movie.mood}`;
    const matchedKeywords = likedKeywords.filter(kw => checkKeywordMatch(movieText, [kw]));
    if (matchedKeywords.length > 0) {
      reasons.push(`Matching keyword: ${matchedKeywords[0]}`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('Highly rated movie');
  }

  return reasons.slice(0, 3);
}

exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    const preference = await prisma.userPreference.findUnique({
      where: { userId },
    });

    const hasPreferences = preference && (
      (preference.likedGenres && JSON.parse(preference.likedGenres).length > 0) ||
      (preference.dislikedGenres && JSON.parse(preference.dislikedGenres).length > 0) ||
      (preference.likedMoods && JSON.parse(preference.likedMoods).length > 0) ||
      (preference.dislikedMoods && JSON.parse(preference.dislikedMoods).length > 0) ||
      (preference.likedKeywords && JSON.parse(preference.likedKeywords).length > 0) ||
      (preference.dislikedKeywords && JSON.parse(preference.dislikedKeywords).length > 0)
    );

    if (!hasPreferences) {
      const popularMovies = await tmdbService.getPopularMoviesForRecommendations();
      return res.json({
        success: true,
        data: popularMovies.slice(0, 20).map(m => ({ 
          ...m, 
          personalizationScore: Math.round(m.rating * 0.5), 
          recommendationReasons: [] 
        })),
        fallback: true,
      });
    }

    const parseJsonArray = (str) => {
      try { return JSON.parse(str || '[]'); } catch { return []; }
    };

    const preferenceData = await prisma.userPreference.findUnique({
      where: { userId: req.user.id },
    });

    const preferences = {
      likedGenres: parseJsonArray(preferenceData.likedGenres),
      dislikedGenres: parseJsonArray(preferenceData.dislikedGenres),
      likedMoods: parseJsonArray(preferenceData.likedMoods),
      dislikedMoods: parseJsonArray(preferenceData.dislikedMoods),
      likedKeywords: parseJsonArray(preferenceData.likedKeywords),
      dislikedKeywords: parseJsonArray(preferenceData.dislikedKeywords),
    };

    const cacheKey = `personalized:${req.user.id}`;
    const cached = personalizedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[Personalized] Cache HIT');
      return res.json({ success: true, data: cached.data });
    }

    const popularMovies = await tmdbService.getPopularMoviesForRecommendations();

    const scoredMovies = popularMovies.map(movie => {
      const score = calculatePersonalizationScore(movie, {
        likedGenres: preferences.likedGenres,
        dislikedGenres: preferences.dislikedGenres,
        likedMoods: preferences.likedMoods,
        dislikedMoods: preferences.dislikedMoods,
        likedKeywords: preferences.likedKeywords,
        dislikedKeywords: preferences.dislikedKeywords,
      });
      const reasons = getRecommendationReasons(movie, {
        likedGenres: preferences.likedGenres,
        dislikedGenres: preferences.dislikedGenres,
        likedMoods: preferences.likedMoods,
        dislikedMoods: preferences.dislikedMoods,
        likedKeywords: preferences.likedKeywords,
        dislikedKeywords: preferences.dislikedKeywords,
      });
      return { ...movie, personalizationScore: Math.round(score * 100) / 100, recommendationReasons: reasons };
    });

    scoredMovies.sort((a, b) => b.personalizationScore - a.personalizationScore);

    const topMovies = scoredMovies.slice(0, 20);

    personalizedCache.set(cacheKey, {
      data: topMovies,
      timestamp: Date.now()
    });

    return res.json({ success: true, data: topMovies });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllMovies: exports.getAllMovies,
  getMovieById: exports.getMovieById,
  getRecommendedMovies: exports.getRecommendedMovies,
  getPersonalizedRecommendations: exports.getPersonalizedRecommendations
};
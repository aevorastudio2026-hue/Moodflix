const axios = require('axios');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Default placeholder image URL
const DEFAULT_PLACEHOLDER_URL = 'https://placehold.co/500x750?text=No+Poster';

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is required but not set');
}

// Genre mapping from TMDb genre IDs to our genre names
const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Mood mapping based on genre combinations and keywords (English mood names)
const MOOD_KEYWORDS = {
  'Exciting': ['action', 'adventure', 'thriller'],
  'Fun': ['comedy', 'family', 'animation'],
  'Dramatic': ['drama', 'history', 'war'],
  'Scary': ['horror', 'thriller', 'mystery'],
  'Mind-Bending': ['mystery', 'sci-fi', 'thriller'],
  'Inspiring': ['biography', 'history', 'documentary'],
  'Intense': ['drama', 'thriller', 'war'],
  'Mesmerizing': ['fantasy', 'animation', 'family'],
  'Nostalgic': ['history', 'documentary', 'western'],
  'Easy Watch': ['comedy', 'family', 'animation'],
  'Tearjerker': ['drama', 'romance', 'tragedy'],
  'Motivational': ['sport', 'biography', 'documentary'],
  'Late Night': ['noir', 'thriller', 'mystery', 'crime'],
  'Epic': ['war', 'history', 'fantasy', 'adventure'],
  'Suspenseful': ['thriller', 'mystery', 'horror']
};

// Simple in-memory cache with TTL (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;
const tmdbCache = new Map();

function getCacheKey(endpoint, params) {
  const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${endpoint}?${sortedParams}`;
}

function getFromCache(key) {
  const cached = tmdbCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  if (cached) {
    tmdbCache.delete(key);
  }
  return null;
}

function setCache(key, data) {
  tmdbCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

async function fetchFromTMDB(endpoint, params = {}) {
  const cacheKey = getCacheKey(endpoint, params);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[TMDB Cache] HIT: ${endpoint}`);
    return Promise.resolve(cached);
  }
  
  console.log(`[TMDB Cache] MISS: ${endpoint}`);
  return fetchFromTMDBUncached(endpoint, params).then(data => {
    setCache(cacheKey, data);
    return data;
  });
}

async function fetchFromTMDBUncached(endpoint, params = {}) {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error(`TMDB API error for ${endpoint}:`, error.message);
    throw error;
  }
}

function mapTMDbMood(tmdbMovie) {
  const genreIds = tmdbMovie.genre_ids || [];
  const genreNames = genreIds.map(id => GENRE_MAP[id]).filter(Boolean).map(g => g.toLowerCase());
  
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (genreNames.some(g => keywords.includes(g.toLowerCase()))) {
      return mood;
    }
  }
  return 'Dramatic';
}

function transformTMDbMovie(tmdbMovie) {
  const mood = mapTMDbMood(tmdbMovie);
  const genreNames = (tmdbMovie.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean);
  const primaryGenre = genreNames[0] || 'Drama';

  return {
    id: `tmdb-${tmdbMovie.id}`,
    title: tmdbMovie.title || tmdbMovie.original_title || 'Unknown Title',
    genre: genreNames.join(', ') || primaryGenre,
    mood: mood,
    rating: tmdbMovie.vote_average || 0,
    releaseYear: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
    description: tmdbMovie.overview || 'No description available in English.',
    posterUrl: tmdbMovie.poster_path 
      ? `${TMDB_IMAGE_BASE_URL}${tmdbMovie.poster_path}`
      : DEFAULT_PLACEHOLDER_URL
  };
}

// Popular movies
async function getPopularMovies(page = 1) {
  const data = await fetchFromTMDB('/discover/movie', {
    sort_by: 'popularity.desc',
    page,
    'vote_count.gte': 100,
    include_adult: false,
    language: 'en-US'
  });
  return {
    movies: data.results.map(transformTMDbMovie),
    total: data.total_results,
    page: data.page,
    totalPages: data.total_pages
  };
}

// Search movies
async function searchMovies(query, page = 1) {
  const data = await fetchFromTMDB('/search/movie', {
    query,
    page,
    include_adult: false,
    language: 'en-US'
  });
  return {
    movies: data.results.map(transformTMDbMovie),
    total: data.total_results,
    page: data.page,
    totalPages: data.total_pages
  };
}

// Get movies by genre
async function getMoviesByGenre(genre, page = 1) {
  const genreId = Object.keys(GENRE_MAP).find(key => 
    GENRE_MAP[key].toLowerCase() === genre.toLowerCase()
  );
  
  if (!genreId) {
    return { movies: [], total: 0, page: 1, totalPages: 0 };
  }

  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
    'vote_count.gte': 100,
    include_adult: false,
    language: 'en-US'
  });
  return {
    movies: data.results.map(transformTMDbMovie),
    total: data.total_results,
    page: data.page,
    totalPages: data.total_pages
  };
}

// Get movies by mood
async function getMoviesByMood(mood, page = 1) {
  const moodKeywords = MOOD_KEYWORDS[mood];
  if (!moodKeywords) {
    return { movies: [], total: 0, page: 1, totalPages: 0 };
  }

  const genreIds = Object.keys(GENRE_MAP)
    .filter(key => moodKeywords.includes(GENRE_MAP[key].toLowerCase()))
    .join(',');

  if (!genreIds) {
    return { movies: [], total: 0, page: 1, totalPages: 0 };
  }

  const data = await fetchFromTMDB('/discover/movie', {
    with_genres: genreIds,
    sort_by: 'popularity.desc',
    page,
    'vote_count.gte': 100,
    include_adult: false,
    language: 'en-US'
  });
  return {
    movies: data.results.map(transformTMDbMovie),
    total: data.total_results,
    page: data.page,
    totalPages: data.total_pages
  };
}

// Get movie details by ID
async function getMovieById(movieId) {
  const tmdbId = movieId.replace('tmdb-', '');
  
  try {
    const data = await fetchFromTMDB(`/movie/${tmdbId}`, {
      append_to_response: 'credits,videos',
      language: 'en-US'
    });
    return transformTMDbMovie(data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

// Get popular movies for recommendations
async function getPopularMoviesForRecommendations() {
  const data = await fetchFromTMDB('/movie/popular', {
    language: 'en-US',
    page: 1
  });
  return data.results.map(transformTMDbMovie);
}

module.exports = {
  getPopularMovies,
  searchMovies,
  getMoviesByGenre,
  getMoviesByMood,
  getMovieById,
  getPopularMoviesForRecommendations,
  transformTMDbMovie,
  mapTMDbMood
};
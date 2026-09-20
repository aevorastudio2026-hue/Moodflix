const API_BASE = '/api';

let currentPage = 1;
let currentMoods = [];
let currentSearch = '';
let totalPages = 1;
let userPreferences = {
  likedGenres: [],
  dislikedGenres: [],
  likedMoods: [],
  dislikedMoods: [],
  likedKeywords: [],
  dislikedKeywords: [],
};
let searchDebounceTimer = null;
let moodScrollDebounceTimer = null;

// Simple client-side cache with TTL
const CLIENT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const clientCache = new Map();

function getFromClientCache(key) {
  const cached = clientCache.get(key);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    console.log(`[ClientCache] HIT: ${key}`);
    return cached.data;
  }
  if (cached) {
    clientCache.delete(key);
  }
  return null;
}

function setClientCache(key, data) {
  clientCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCacheKey(params) {
  const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `movies?${sortedParams}`;
}

// Available genres and moods from movie data (backend values - English)
const ALL_GENRES = ['Action', 'Animation', 'Comedy', 'Crime', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Sport', 'Thriller'];
const ALL_MOODS = ['Exciting', 'Fun', 'Dramatic', 'Scary', 'Mind-bending', 'Inspiring', 'Intense', 'Captivating', 'Nostalgic', 'Chill', 'Tearjerker', 'Motivational', 'Late Night', 'Suspenseful', 'Epic'];

// Mood display labels (UI labels - English for user)
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

// English mood mapping for API calls (TMDB service uses English mood names)
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

// Default fallback poster URL
const DEFAULT_POSTER = 'https://placehold.co/500x750?text=No+Poster';


// Mock movie data for fallback when API fails
const MOCK_MOVIES = [
  {
    id: 'mock-1',
    title: 'The Dark Knight',
    genre: 'Action',
    mood: 'Exciting',
    rating: 9.0,
    releaseYear: 2008,
    description: 'Batman faces the Joker in this epic crime thriller.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
  },
  {
    id: 'mock-2',
    title: 'Inception',
    genre: 'Sci-Fi',
    mood: 'Mind-bending',
    rating: 8.8,
    releaseYear: 2010,
    description: 'A thief who enters dreams to steal secrets.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'
  },
  {
    id: 'mock-3',
    title: 'The Shawshank Redemption',
    genre: 'Drama',
    mood: 'Inspiring',
    rating: 9.3,
    releaseYear: 1994,
    description: 'Two imprisoned men bond over years.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
  },
  {
    id: 'mock-4',
    title: 'The Grand Budapest Hotel',
    genre: 'Comedy',
    mood: 'Fun',
    rating: 8.1,
    releaseYear: 2014,
    description: 'A legendary concierge and his lobby boy.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/eWdyRC8y3YhGzRgBmZWrcH0kxKz.jpg'
  },
  {
    id: 'mock-5',
    title: 'Parasite',
    genre: 'Thriller',
    mood: 'Suspenseful',
    rating: 8.6,
    releaseYear: 2019,
    description: 'A poor family schemes to infiltrate a wealthy household.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'
  },
  {
    id: 'mock-6',
    title: 'Interstellar',
    genre: 'Sci-Fi',
    mood: 'Mind-bending',
    rating: 8.6,
    releaseYear: 2014,
    description: 'A team travels through a wormhole to save humanity.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
  },
  {
    id: 'mock-7',
    title: 'The Matrix',
    genre: 'Action',
    mood: 'Exciting',
    rating: 8.7,
    releaseYear: 1999,
    description: 'A hacker discovers reality is a simulation.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
  },
  {
    id: 'mock-8',
    title: 'Spirited Away',
    genre: 'Animation',
    mood: 'Captivating',
    rating: 8.6,
    releaseYear: 2001,
    description: 'A girl enters a spirit world to save her parents.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg'
  }
];

function getMockMovies() {
  return MOCK_MOVIES;
}

function getPosterUrl(movie) {
  return movie.posterUrl || movie.poster_url || movie.image || DEFAULT_POSTER;
}

let elements = {};
let authToken = localStorage.getItem('moodflix_token');
let currentUser = null;
let currentView = 'home'; // 'home' | 'favorites'

// Initialize view from hash
function initViewFromHash() {
  const hash = window.location.hash.slice(1);
  if (hash === 'favorites' && currentUser) {
    currentView = 'favorites';
  } else {
    currentView = 'home';
  }
}

function navigateTo(view) {
  if (view === 'favorites') {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    currentView = 'favorites';
    window.location.hash = 'favorites';
    showFavoritesView();
  } else {
    currentView = 'home';
    window.location.hash = '';
    showHomeView();
  }
}

function showHomeView() {
  // Show home sections
  document.querySelector('.hero').style.display = '';
  document.querySelector('.personalized-section').style.display = currentUser ? '' : 'none';
  document.querySelector('.movies-section').style.display = '';
  document.querySelector('.about-section').style.display = '';
  // Update header title
  document.getElementById('movies-title').textContent = 'Movies';
  // Load movies for home view
  loadMovies();
}

function showFavoritesView() {
  // Hide home sections
  document.querySelector('.hero').style.display = 'none';
  document.querySelector('.personalized-section').style.display = 'none';
  document.querySelector('.movies-section').style.display = '';
  document.querySelector('.about-section').style.display = 'none';
  // Update header title
  document.getElementById('movies-title').textContent = 'My Favorites';
  // Load favorites
  loadFavorites();
}

function cacheElements() {
  elements = {
    moviesGrid: document.getElementById('moviesGrid'),
    loadingState: document.getElementById('loadingState'),
    pagination: document.getElementById('pagination'),
    sectionMeta: document.getElementById('sectionMeta'),
    searchForm: document.getElementById('searchForm'),
    searchInput: document.getElementById('searchInput'),
    moodSelector: document.getElementById('moodSelector'),
    moodBtns: document.querySelectorAll('.mood-btn'),
    movieModal: document.getElementById('movieModal'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalClose'),
    authModal: document.getElementById('authModal'),
    authModalClose: document.getElementById('authModalClose'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    favoritesBtn: document.getElementById('favoritesBtn'),
    preferencesBtn: document.getElementById('preferencesBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    authTabs: document.querySelectorAll('.auth-tab'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    // Preferences modal elements
    preferencesModal: document.getElementById('preferencesModal'),
    preferencesModalClose: document.getElementById('preferencesModalClose'),
    preferencesForm: document.getElementById('preferencesForm'),
    preferencesTabs: document.querySelectorAll('.preferences-tab'),
    preferencesPanels: document.querySelectorAll('.preferences-panel'),
    cancelPreferencesBtn: document.getElementById('cancelPreferencesBtn'),
    preferencesError: document.getElementById('preferencesError'),
    preferencesSuccess: document.getElementById('preferencesSuccess'),
    // Genre chips
    likedGenresChips: document.getElementById('likedGenresChips'),
    dislikedGenresChips: document.getElementById('dislikedGenresChips'),
    // Mood chips
    likedMoodsChips: document.getElementById('likedMoodsChips'),
    dislikedMoodsChips: document.getElementById('dislikedMoodsChips'),
    // Keyword inputs
    likedKeywordInput: document.getElementById('likedKeywordInput'),
    addLikedKeywordBtn: document.getElementById('addLikedKeywordBtn'),
    likedKeywordsChips: document.getElementById('likedKeywordsChips'),
    dislikedKeywordInput: document.getElementById('dislikedKeywordInput'),
    addDislikedKeywordBtn: document.getElementById('addDislikedKeywordBtn'),
    dislikedKeywordsChips: document.getElementById('dislikedKeywordsChips'),
    // Personalized section elements
    personalizedSection: document.getElementById('personalizedSection'),
    personalizedGrid: document.getElementById('personalizedGrid'),
    personalizedLoadingState: document.getElementById('personalizedLoadingState'),
    personalizedMeta: document.getElementById('personalizedMeta'),
  };
}

function init() {
  cacheElements();
  setupEventListeners();
  initViewFromHash();
  // Listen for hash changes (back/forward navigation)
  window.addEventListener('hashchange', () => initViewFromHash());
  checkAuth();
  loadMovies();
}

function setupEventListeners() {
  elements.searchForm.addEventListener('submit', handleSearch);
  
  // Search clear detection (handles X button and manual clear)
  elements.searchInput.addEventListener('search', handleSearchClear);
  elements.searchInput.addEventListener('input', handleSearchInput);
  
  elements.moodSelector.addEventListener('click', handleMoodSelect);
  elements.modalClose.addEventListener('click', closeModal);
  elements.movieModal.addEventListener('click', (e) => {
    if (e.target === elements.movieModal) closeModal();
  });
  elements.authModalClose.addEventListener('click', closeAuthModal);
  elements.authModal.addEventListener('click', (e) => {
    if (e.target === elements.authModal) closeAuthModal();
  });
  elements.loginBtn.addEventListener('click', () => openAuthModal('login'));
  elements.registerBtn.addEventListener('click', () => openAuthModal('register'));
  elements.logoutBtn.addEventListener('click', logout);
  elements.favoritesBtn.addEventListener('click', () => navigateTo('favorites'));
  elements.preferencesBtn.addEventListener('click', openPreferencesModal);

  elements.authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  elements.loginForm.addEventListener('submit', handleLogin);
  elements.registerForm.addEventListener('submit', handleRegister);

  // Preferences modal events
  elements.preferencesModalClose.addEventListener('click', closePreferencesModal);
  elements.preferencesModal.addEventListener('click', (e) => {
    if (e.target === elements.preferencesModal) closePreferencesModal();
  });
  // Stop propagation on modal content to prevent closing when clicking inside
  const preferencesModalContent = document.querySelector('.preferences-modal');
  if (preferencesModalContent) {
    preferencesModalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  elements.cancelPreferencesBtn.addEventListener('click', closePreferencesModal);
  elements.preferencesForm.addEventListener('submit', handleSavePreferences);
  elements.preferencesTabs.forEach(tab => {
    tab.addEventListener('click', (e) => switchPreferencesTab(tab.dataset.tab, e));
  });
  elements.addLikedKeywordBtn.addEventListener('click', () => addKeyword('liked'));
  elements.addDislikedKeywordBtn.addEventListener('click', () => addKeyword('disliked'));
  elements.likedKeywordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword('liked'); }
  });
  elements.dislikedKeywordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addKeyword('disliked'); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeAuthModal();
      closePreferencesModal();
    }
  });
}

async function checkAuth() {
  const token = localStorage.getItem('moodflix_token');
  if (!token) {
    initViewFromHash();
    if (currentView === 'home') loadMovies();
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      authToken = token;
      updateAuthUI();
      initViewFromHash();
      // Run in parallel
      await Promise.allSettled([
        currentView === 'favorites' ? loadFavorites() : loadMovies(),
        loadPersonalizedRecommendations()
      ]);
    } else {
      console.warn('[checkAuth] Session invalid, removing token');
      localStorage.removeItem('moodflix_token');
      initViewFromHash();
      if (currentView === 'home') loadMovies();
    }
  } catch (e) {
    console.error('[checkAuth] Error:', e);
    localStorage.removeItem('moodflix_token');
    initViewFromHash();
    if (currentView === 'home') loadMovies();
  }
}

function updateAuthUI() {
  if (currentUser) {
    elements.loginBtn.style.display = 'none';
    elements.registerBtn.style.display = 'none';
    elements.favoritesBtn.style.display = 'inline-flex';
    elements.preferencesBtn.style.display = 'inline-flex';
    elements.logoutBtn.style.display = 'inline-flex';
  } else {
    elements.loginBtn.style.display = 'inline-flex';
    elements.registerBtn.style.display = 'inline-flex';
    elements.favoritesBtn.style.display = 'none';
    elements.preferencesBtn.style.display = 'none';
    elements.logoutBtn.style.display = 'none';
    elements.personalizedSection.hidden = true;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('moodflix_token', authToken);
    updateAuthUI();
    closeAuthModal();
    showToast('Sign in successful! 🎉');
    // After login, go to home view and load movies
    navigateTo('home');
    loadPersonalizedRecommendations();
  } catch (err) {
    console.error('[handleLogin] Error:', {
      message: err.message,
      stack: err.stack,
      email
    });
    elements.loginError.textContent = err.message;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);

    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('moodflix_token', authToken);
    updateAuthUI();
    closeAuthModal();
    showToast('Registration successful! Welcome 🎬');
    // After registration, go to home view and load movies
    navigateTo('home');
    loadPersonalizedRecommendations();
  } catch (err) {
    console.error('[handleRegister] Error:', {
      message: err.message,
      stack: err.stack,
      email
    });
    elements.registerError.textContent = err.message;
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('moodflix_token');
  updateAuthUI();
  navigateTo('home');
  showToast('Signed out');
}

function openAuthModal(tab = 'login') {
  elements.authModal.hidden = false;
  switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const input = elements.authModal.querySelector('input');
    if (input) input.focus();
  }, 100);
}

function closeAuthModal() {
  elements.authModal.hidden = true;
  document.body.style.overflow = '';
  elements.loginError.textContent = '';
  elements.registerError.textContent = '';
  elements.loginForm.reset();
  elements.registerForm.reset();
}

function switchAuthTab(tab) {
  elements.authTabs.forEach(t => {
    t.setAttribute('aria-selected', t.dataset.tab === tab);
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  elements.loginForm.setAttribute('aria-hidden', tab !== 'login');
  elements.registerForm.setAttribute('aria-hidden', tab !== 'register');
}

async function handleSearch(e) {
  e.preventDefault();
  currentSearch = elements.searchInput.value.trim();
  currentPage = 1;
  await loadMovies();
  // Smooth scroll to movies grid when search is submitted
  if (elements.moviesGrid) {
    elements.moviesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function handleSearchClear(e) {
  // Triggered by the browser's clear button (X) on type="search" inputs
  if (elements.searchInput.value === '') {
    currentSearch = '';
    currentPage = 1;
    loadMovies();
  }
}

function handleSearchInput(e) {
  // Debounced search - wait 300ms after user stops typing
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const value = elements.searchInput.value.trim();
    if (value === '' && currentSearch !== '') {
      currentSearch = '';
      currentPage = 1;
      loadMovies();
    } else if (value !== currentSearch) {
      currentSearch = value;
      currentPage = 1;
      loadMovies();
    }
  }, 300);
}

function handleMoodSelect(e) {
  const btn = e.target.closest('.mood-btn');
  if (!btn) return;

  const mood = btn.dataset.mood;
  const index = currentMoods.indexOf(mood);
  
  if (index > -1) {
    // Remove mood if already selected
    currentMoods.splice(index, 1);
    btn.setAttribute('aria-pressed', 'false');
    btn.classList.remove('active');
  } else {
    // Add mood if not selected
    currentMoods.push(mood);
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('active');
  }
  
  currentPage = 1;
  loadMovies();
  
  // Smooth scroll to movies grid after 1.5s delay
  setTimeout(() => {
    const targetElement = document.getElementById('moviesGrid') || document.querySelector('.movies-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 1500);
}

async function loadMovies() {
  console.log('[loadMovies] Starting loadMovies...');
  showLoading(true);

  const params = new URLSearchParams({
    page: currentPage,
    limit: 12
  });

  if (currentMoods.length > 0) {
    // Map English mood names to API mood names
    const englishMoods = currentMoods.map(m => ENGLISH_MOOD_MAP[m] || m);
    params.set('moods', englishMoods.join(','));
  }
  if (currentSearch) params.set('search', currentSearch);

  // Check client cache first
  const cacheKey = getCacheKey(Object.fromEntries(params));
  const cachedData = getFromClientCache(cacheKey);
  if (cachedData) {
    console.log('[loadMovies] Using cached data');
    renderMovies(cachedData);
    renderLoadMore({ page: currentPage, limit: 12, total: cachedData.length, totalPages: 1 });
    updateSectionMeta({ page: 1, limit: 12, total: cachedData.length, totalPages: 1 });
    showLoading(false);
    return;
  }

  try {
    console.log('[loadMovies] Fetching from:', `${API_BASE}/movies?${params}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/movies?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    console.log('[loadMovies] Response status:', res.status);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    const response = await res.json();
    console.log('[loadMovies] Response received:', response);

    // Handle both response formats: {data: [...]} or [...]
    const movies = extractMoviesArray(response);
    console.log('[loadMovies] Movies extracted:', movies.length);
    const pagination = extractPagination(response, movies.length);

    // Cache the response
    const cacheKey = getCacheKey(Object.fromEntries(params));
    setClientCache(cacheKey, movies);

    renderMovies(movies);
    renderLoadMore(pagination);
    updateSectionMeta(pagination);
  } catch (err) {
    console.error('[loadMovies] Error:', {
      message: err.message,
      stack: err.stack,
      moods: currentMoods,
      search: currentSearch,
      page: currentPage
    });
    
    // Fallback to mock data when API fails
    const fallbackMovies = getMockMovies();
    renderMovies(fallbackMovies);
    renderLoadMore({ page: 1, limit: 12, total: fallbackMovies.length, totalPages: 1 });
    updateSectionMeta({ page: 1, limit: 12, total: fallbackMovies.length, totalPages: 1 });
    showError('Failed to load movies from server. Showing sample data.');
  } finally {
    showLoading(false);
  }
}

// Load personalized recommendations for authenticated users
async function loadPersonalizedRecommendations() {
  // Only load for authenticated users
  if (!currentUser || !authToken) {
    elements.personalizedSection.hidden = true;
    return;
  }

  // Show the section and loading state
  elements.personalizedSection.hidden = false;
  elements.personalizedLoadingState.style.display = 'flex';
  elements.personalizedGrid.style.opacity = '0';
  elements.personalizedMeta.textContent = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/movies/recommend/personalized`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401) {
        // Token invalid, hide section
        elements.personalizedSection.hidden = true;
        return;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    const response = await res.json();

    // Handle response format
    const movies = extractMoviesArray(response);
    const isFallback = response.fallback === true;

    renderMovies(movies, elements.personalizedGrid, true);
    elements.personalizedLoadingState.style.display = 'none';
    elements.personalizedGrid.style.opacity = '1';

    if (isFallback) {
      elements.personalizedMeta.textContent = `${movies.length} film — Popüler filmlerden öneriler`;
    } else {
      elements.personalizedMeta.textContent = `${movies.length} film — Kişiselleştirilmiş öneriler`;
    }

  } catch (err) {
    console.error('[loadPersonalizedRecommendations] Error:', {
      message: err.message,
      stack: err.stack
    });
    // Hide personalized section on error, don't break main movie list
    elements.personalizedSection.hidden = true;
    elements.personalizedLoadingState.style.display = 'none';
  }
}

// Helper to extract movies array from various response formats
function extractMoviesArray(response) {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  if (response && Array.isArray(response.movies)) {
    return response.movies;
  }
  return [];
}

// Helper to extract pagination info
function extractPagination(response, totalCount) {
  if (response && response.pagination) {
    const pagination = response.pagination;
    // Cap totalPages at 500 (TMDB API max pages)
    return {
      ...pagination,
      totalPages: Math.min(pagination.totalPages, 500)
    };
  }
  // Backward compatibility: construct pagination from response
  const totalPages = Math.ceil(totalCount / 12);
  return {
    page: currentPage,
    limit: 12,
    total: totalCount,
    totalPages: Math.min(totalPages, 500)
  };
}

function renderMovies(movies, container = elements.moviesGrid, showReasons = false) {
  console.log('[renderMovies] Called with', movies?.length || 0, 'movies');
  
  // Ensure movies is an array
  const moviesArray = Array.isArray(movies) ? movies : [];

  // Safety check for container element
  if (!container) {
    console.error('[renderMovies] Container element not found!');
    return;
  }

  if (moviesArray.length === 0) {
    let emptyMessage = 'No movies found matching your criteria.';
    let emptySubMessage = 'Try searching for another mood or title.';
    
    if (currentSearch) {
      emptyMessage = `No movies found for "${escapeHtml(currentSearch)}".`;
      emptySubMessage = 'Try a different search term or browse by mood.';
    } else if (currentMoods.length > 0) {
      emptyMessage = `No movies found for ${currentMoods.map(m => MOOD_LABELS[m] || m).join(', ')}.`;
      emptySubMessage = 'Try selecting a different mood or clearing filters.';
    }
    
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="M21 21l-4.35-4.35"></path>
          <path d="M14 11a3 3 0 1 1-6 0"></path>
        </svg>
        <h3>${emptyMessage}</h3>
        <p>${emptySubMessage}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = moviesArray.map(movie => `
    <article class="movie-card" tabindex="0" role="listitem" data-id="${movie.id}">
      <div class="movie-poster">
        <img src="${getPosterUrl(movie)}" alt="${movie.title} poster" loading="lazy" referrerpolicy="no-referrer-when-downgrade" onerror="this.onerror=null; this.src='${DEFAULT_POSTER}';">
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        <div class="movie-meta">
          <span class="movie-rating">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${movie.rating.toFixed(1)}
          </span>
          <span class="movie-genre">${escapeHtml(movie.genre)}</span>
          <span class="movie-mood mood-${slugify(movie.mood)}">${MOOD_LABELS[movie.mood] || movie.mood}</span>
        </div>
        ${showReasons && movie.recommendationReasons && movie.recommendationReasons.length > 0 ? `
        <div class="recommendation-reasons">
          ${movie.recommendationReasons.slice(0, 3).map(reason => `<span class="recommendation-reason">🎯 ${escapeHtml(reason)}</span>`).join('')}
        </div>
        ` : ''}
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => openMovieModal(card.dataset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMovieModal(card.dataset.id);
      }
    });
  });
}

function renderLoadMore(pagination) {
  totalPages = pagination.totalPages;
  currentPage = pagination.page;

  if (totalPages <= 1 || currentPage >= totalPages) {
    elements.pagination.innerHTML = '';
    return;
  }

  elements.pagination.innerHTML = `
    <button class="btn btn-primary load-more-btn" id="loadMoreBtn" type="button">
      <span class="load-more-text">Load More</span>
      <span class="load-more-spinner" style="display: none;">⟳</span>
    </button>
  `;

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.querySelector('.load-more-text').style.display = 'none';
      loadMoreBtn.querySelector('.load-more-spinner').style.display = 'inline';
      
      currentPage++;
      await loadMoviesAppend();
      
      loadMoreBtn.disabled = false;
      loadMoreBtn.querySelector('.load-more-text').style.display = 'inline';
      loadMoreBtn.querySelector('.load-more-spinner').style.display = 'none';
      
      if (currentPage >= totalPages) {
        loadMoreBtn.style.display = 'none';
      }
    });
  }
}

async function loadMoviesAppend() {
  const params = new URLSearchParams({
    page: currentPage,
    limit: 12
  });

  if (currentMoods.length > 0) {
    // Map English mood names to API mood names
    const englishMoods = currentMoods.map(m => ENGLISH_MOOD_MAP[m] || m);
    params.set('moods', englishMoods.join(','));
  }
  if (currentSearch) params.set('search', currentSearch);

  try {
    console.log('[loadMoviesAppend] Fetching from:', `${API_BASE}/movies?${params}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/movies?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    const response = await res.json();
    const movies = extractMoviesArray(response);
    const pagination = extractPagination(response, movies.length);
    
    appendMovies(movies);
    renderLoadMore(pagination);
    updateSectionMeta(pagination);
  } catch (err) {
    console.error('[loadMoviesAppend] Error:', err);
    showToast('Failed to load more movies');
  }
}

function appendMovies(movies) {
  const moviesArray = Array.isArray(movies) ? movies : [];
  if (moviesArray.length === 0) return;
  
  const container = elements.moviesGrid;
  if (!container) return;
  
  const newMoviesHtml = moviesArray.map(movie => `
    <article class="movie-card" tabindex="0" role="listitem" data-id="${movie.id}">
      <div class="movie-poster">
        <img src="${getPosterUrl(movie)}" alt="${movie.title} poster" loading="lazy" referrerpolicy="no-referrer-when-downgrade" onerror="this.onerror=null; this.src='${DEFAULT_POSTER}';">
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        <div class="movie-meta">
          <span class="movie-rating">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${movie.rating.toFixed(1)}
          </span>
          <span class="movie-genre">${escapeHtml(movie.genre)}</span>
          <span class="movie-mood mood-${slugify(movie.mood)}">${MOOD_LABELS[movie.mood] || movie.mood}</span>
        </div>
      </div>
    </article>
  `).join('');
  
  container.insertAdjacentHTML('beforeend', newMoviesHtml);
  
  // Add event listeners to new movie cards
  container.querySelectorAll('.movie-card:not([data-listener-added])').forEach(card => {
    card.dataset.listenerAdded = 'true';
    card.addEventListener('click', () => openMovieModal(card.dataset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMovieModal(card.dataset.id);
      }
    });
  });
}

function updateSectionMeta(pagination) {
  if (currentMoods.length > 0 || currentSearch) {
    let parts = [];
    if (currentMoods.length > 0) parts.push(`"${currentMoods.join(', ')}" moods`);
    if (currentSearch) parts.push(`"${currentSearch}" search`);
    elements.sectionMeta.textContent = `${pagination.total} movies found · ${parts.join(' · ')}`;
  } else {
    elements.sectionMeta.textContent = `${pagination.total} movies`;
  }
}

async function openMovieModal(movieId) {
  elements.modalContent.innerHTML = `
    <div class="loading" style="padding: 60px; grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
  elements.movieModal.hidden = false;
  document.body.style.overflow = 'hidden';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/movies/${movieId}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    const response = await res.json();

    // Handle response format: {success: true, data: movie} or {movie: ...} or just movie object
    const movie = response.data || response.movie || response;
    if (!movie || !movie.id) {
      throw new Error('Invalid movie data');
    }

    renderMovieModal(movie);
  } catch (err) {
    console.error('[openMovieModal] Error:', {
      message: err.message,
      stack: err.stack,
      movieId
    });
    elements.modalContent.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>Failed to load movie details: ${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

function renderMovieModal(movie) {
  const isFavorite = currentUser ? checkIfFavorite(movie.id) : false;
  const posterUrl = getPosterUrl(movie);

  elements.modalContent.innerHTML = `
    <div class="modal-poster">
      <img src="${posterUrl}" alt="${escapeHtml(movie.title)} poster" referrerpolicy="no-referrer-when-downgrade" onerror="this.onerror=null; this.src='${DEFAULT_POSTER}';">
    </div>
    <div class="modal-details">
      <h2 class="modal-title">${escapeHtml(movie.title)}</h2>
      <div class="modal-meta">
        <span class="modal-rating">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${movie.rating.toFixed(1)} / 10
        </span>
        <span class="modal-separator">·</span>
        <span class="modal-genre">${escapeHtml(movie.genre)}</span>
        <span class="modal-separator">·</span>
        <span class="modal-genre">${movie.releaseYear}</span>
        <span class="modal-separator">·</span>
        <span class="modal-mood-badge mood-${slugify(movie.mood)}">${MOOD_LABELS[movie.mood] || movie.mood}</span>
      </div>
      <p class="modal-description">${escapeHtml(movie.description)}</p>
      <div class="modal-actions">
        ${currentUser ? `
          <button type="button" id="modal-fav-btn" class="btn btn-primary ${isFavorite ? 'btn-secondary' : ''}" 
                  data-favorite="${movie.id}">
            ${isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
          </button>
        ` : `
          <button type="button" class="btn btn-primary" onclick="closeModal(); openAuthModal('login')">
            🔐 Sign in to Add to Favorites
          </button>
        `}
      </div>
    </div>
  `;

  // Attach favorite button click handler after modal content is rendered
  const favBtn = document.getElementById('modal-fav-btn');
  if (favBtn) {
    favBtn.onclick = async (e) => {
      e.preventDefault();
      await toggleFavorite(movie.id, favBtn);
    };
  }
}

function checkIfFavorite(movieId) {
  if (!currentUser) return false;
  // Check against loaded favorites if available, otherwise default to false
  // This will be properly checked when modal opens via the favorites API
  return window.favoriteMovieIds?.has(movieId) || false;
}

// Global set to track favorite movie IDs for quick lookup
window.favoriteMovieIds = new Set();

window.toggleFavorite = async function(movieId, btn) {
  if (!currentUser) {
    closeModal();
    openAuthModal('login');
    return;
  }

  const isFavorite = btn.classList.contains('btn-secondary');

  try {
    if (isFavorite) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE}/favorites/${movieId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      btn.classList.remove('btn-secondary');
      btn.textContent = '🤍 Add to Favorites';
      window.favoriteMovieIds.delete(movieId);
      showToast('Removed from favorites');
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ movieId }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      btn.classList.add('btn-secondary');
      btn.textContent = '❤️ Remove from Favorites';
      window.favoriteMovieIds.add(movieId);
      showToast('Added to favorites! ❤️');
    }
  } catch (err) {
    console.error('[toggleFavorite] Error:', {
      message: err.message,
      stack: err.stack,
      movieId,
      isFavorite
    });
    showToast('Operation failed: ' + err.message);
  }
};

async function loadFavorites() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  currentMoods = [];
  currentSearch = '';
  currentPage = 1;
  elements.moodBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
  elements.searchInput.value = '';

  showLoading(true);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/favorites`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const response = await res.json();

    // Handle various response formats: {favorites: [...]}, {data: [...]}, or [...]
    let favorites = [];
    if (Array.isArray(response)) {
      favorites = response;
    } else if (response && Array.isArray(response.favorites)) {
      favorites = response.favorites;
    } else if (response && Array.isArray(response.data)) {
      favorites = response.data;
    }

    // Update favorite movie IDs set for quick lookup in modal
    window.favoriteMovieIds = new Set(favorites.map(f => f.movieId || f.movie?.id).filter(Boolean));

    elements.sectionMeta.textContent = `${favorites.length} favorite movies`;
    renderFavoriteMovies(favorites);
  } catch (err) {
    console.error('[loadFavorites] Error:', {
      message: err.message,
      stack: err.stack
    });
    showError('Failed to load favorites: ' + err.message);
  } finally {
    showLoading(false);
  }
}

function renderFavoriteMovies(favorites) {
  // Ensure favorites is an array
  const favoritesArray = Array.isArray(favorites) ? favorites : [];

  if (favoritesArray.length === 0) {
    elements.moviesGrid.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h3>No favorites yet</h3>
        <p>Click on movie cards and select "Add to Favorites" to build your list</p>
      </div>
    `;
    elements.pagination.innerHTML = '';
    return;
  }

  const movies = favoritesArray.map(f => f.movie || f);
  renderMovies(movies);
  elements.pagination.innerHTML = '';
}

function closeModal() {
  elements.movieModal.hidden = true;
  document.body.style.overflow = '';
  elements.modalContent.innerHTML = '';
}

function showLoading(show) {
  console.log('[showLoading] show =', show);
  if (!elements.loadingState) {
    console.error('[showLoading] loadingState element not found!');
    return;
  }
  elements.loadingState.style.display = show ? 'flex' : 'none';
  if (!show) {
    elements.moviesGrid.style.opacity = '1';
  }
}

function showError(message) {
  elements.moviesGrid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <h3>An error occurred</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-red));
    color: white;
    padding: 14px 24px;
    border-radius: var(--radius-md);
    font-weight: 500;
    z-index: 2000;
    animation: slideIn 0.3s ease;
    box-shadow: var(--shadow-lg);
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(20px); } }
  .page-ellipsis { color: var(--text-muted); padding: 0 8px; }
`;
document.head.appendChild(style);

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

document.addEventListener('DOMContentLoaded', init);

// ============================================
// PREFERENCES MODAL FUNCTIONS
// ============================================

function openPreferencesModal() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  
  elements.preferencesModal.hidden = false;
  document.body.style.overflow = 'hidden';
  loadUserPreferences();
}

function closePreferencesModal() {
  elements.preferencesModal.hidden = true;
  document.body.style.overflow = '';
  clearPreferencesError();
  clearPreferencesSuccess();
}

function switchPreferencesTab(tab, e) {
  if (e) e.stopPropagation();
  elements.preferencesTabs.forEach(t => {
    t.setAttribute('aria-selected', t.dataset.tab === tab);
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  elements.preferencesPanels.forEach(panel => {
    const panelTab = panel.id.replace('panel-', '');
    const isActive = panelTab === tab;
    panel.hidden = !isActive;
    if (isActive) {
      panel.removeAttribute('hidden');
    }
  });
}

async function loadUserPreferences() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/preferences`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error('Tercihler yüklenemedi');
    const data = await res.json();
    if (data.success && data.data) {
      userPreferences = {
        likedGenres: data.data.likedGenres || [],
        dislikedGenres: data.data.dislikedGenres || [],
        likedMoods: data.data.likedMoods || [],
        dislikedMoods: data.data.dislikedMoods || [],
        likedKeywords: data.data.likedKeywords || [],
        dislikedKeywords: data.data.dislikedKeywords || [],
      };
      renderPreferenceChips();
    }
  } catch (err) {
    console.error('[loadUserPreferences] Error:', err);
    showPreferencesError('Failed to load preferences: ' + err.message);
  }
}

function renderPreferenceChips() {
  renderChipGroup(elements.likedGenresChips, userPreferences.likedGenres, ALL_GENRES, 'liked', 'genres');
  renderChipGroup(elements.dislikedGenresChips, userPreferences.dislikedGenres, ALL_GENRES, 'disliked', 'genres');
  renderChipGroup(elements.likedMoodsChips, userPreferences.likedMoods, ALL_MOODS, 'liked', 'moods');
  renderChipGroup(elements.dislikedMoodsChips, userPreferences.dislikedMoods, ALL_MOODS, 'disliked', 'moods');
  renderKeywordChips(elements.likedKeywordsChips, userPreferences.likedKeywords, 'liked');
  renderKeywordChips(elements.dislikedKeywordsChips, userPreferences.dislikedKeywords, 'disliked');
}

function renderChipGroup(container, selectedItems, allItems, type, category) {
  container.innerHTML = '';
  
  // Render selected chips first
  selectedItems.forEach(item => {
    const chip = createChip(item, type, category, true);
    container.appendChild(chip);
  });
  
  // Render available items as selectable chips
  allItems.forEach(item => {
    if (!selectedItems.includes(item)) {
      const chip = createChip(item, type, category, false);
      chip.addEventListener('click', () => toggleChip(item, type, category));
      container.appendChild(chip);
    }
  });
}

function createChip(label, type, category, isSelected) {
  const chip = document.createElement('div');
  chip.className = `preference-chip ${type} ${isSelected ? '' : 'available'}`;
  chip.dataset.value = label;
  chip.dataset.category = category;
  chip.dataset.type = type;
  
  if (isSelected) {
    chip.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <button type="button" class="chip-remove" aria-label="Remove ${label}">&times;</button>
    `;
    chip.querySelector('.chip-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleChip(label, type, category);
    });
  } else {
    chip.innerHTML = `<span>${escapeHtml(label)}</span>`;
    chip.style.cursor = 'pointer';
    chip.style.opacity = '0.6';
  }
  
  return chip;
}

function toggleChip(label, type, category) {
  const likedKey = category === 'genres' ? 'likedGenres' : 'likedMoods';
  const dislikedKey = category === 'genres' ? 'dislikedGenres' : 'dislikedMoods';
  
  // Remove from both arrays first
  userPreferences[likedKey] = userPreferences[likedKey].filter(item => item !== label);
  userPreferences[dislikedKey] = userPreferences[dislikedKey].filter(item => item !== label);
  
  // Add to the appropriate array
  if (type === 'liked') {
    userPreferences[likedKey].push(label);
  } else {
    userPreferences[dislikedKey].push(label);
  }
  
  renderPreferenceChips();
}

function renderKeywordChips(container, keywords, type) {
  container.innerHTML = '';
  keywords.forEach(keyword => {
    const chip = createKeywordChip(keyword, type);
    container.appendChild(chip);
  });
}

function createKeywordChip(keyword, type) {
  const chip = document.createElement('div');
  chip.className = `preference-chip ${type}`;
  chip.dataset.value = keyword;
  chip.dataset.type = type;
  chip.innerHTML = `
    <span>${escapeHtml(keyword)}</span>
    <button type="button" class="chip-remove" aria-label="Remove ${keyword}">&times;</button>
  `;
  chip.querySelector('.chip-remove').addEventListener('click', () => removeKeyword(keyword, type));
  return chip;
}

function addKeyword(type) {
  const input = type === 'liked' ? elements.likedKeywordInput : elements.dislikedKeywordInput;
  const keyword = input.value.trim();
  
  if (!keyword) return;
  
  const key = type === 'liked' ? 'likedKeywords' : 'dislikedKeywords';
  
  if (userPreferences[key].includes(keyword)) {
    showPreferencesError('This keyword is already added');
    return;
  }
  
  userPreferences[key].push(keyword);
  input.value = '';
  renderKeywordChips(type === 'liked' ? elements.likedKeywordsChips : elements.dislikedKeywordsChips, userPreferences[key], type);
}

function removeKeyword(keyword, type) {
  const key = type === 'liked' ? 'likedKeywords' : 'dislikedKeywords';
  userPreferences[key] = userPreferences[key].filter(k => k !== keyword);
  renderKeywordChips(type === 'liked' ? elements.likedKeywordsChips : elements.dislikedKeywordsChips, userPreferences[key], type);
}

async function handleSavePreferences(e) {
  e.preventDefault();
  clearPreferencesError();
  clearPreferencesSuccess();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API_BASE}/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(userPreferences),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Save failed');
    }
    
    showPreferencesSuccess('Preferences saved!');
    setTimeout(() => {
      closePreferencesModal();
      loadPersonalizedRecommendations();
    }, 1500);
  } catch (err) {
    console.error('[handleSavePreferences] Error:', err);
    showPreferencesError('Save failed: ' + err.message);
  }
}

function showPreferencesError(message) {
  elements.preferencesError.textContent = message;
  elements.preferencesSuccess.textContent = '';
}

function showPreferencesSuccess(message) {
  elements.preferencesSuccess.textContent = message;
  elements.preferencesError.textContent = '';
}

function clearPreferencesError() {
  elements.preferencesError.textContent = '';
}

function clearPreferencesSuccess() {
  elements.preferencesSuccess.textContent = '';
}

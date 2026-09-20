const fs = require('fs');

const filePath = 'C:\\Users\\Rüzgar\\Desktop\\Moodflix\\public\\js\\app.js';
let content = fs.readFileSync('C:\\Users\\Rüzgar\\Desktop\\Moodflix\\public\\js\\app.js', 'utf8');

const oldCode = `async function checkAuth() {
  const token = localStorage.getItem('moodflix_token');
  if (!token) return;

  try {
    const res = await fetch(\`\${API_BASE}/auth/me\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      authToken = token;
      updateAuthUI();
      loadPersonalizedRecommendations();
    } else {
      console.warn('[checkAuth] Session invalid, removing token');
      localStorage.removeItem('moodflix_token');
    }
  } catch (e) {
    console.error('[checkAuth] Error:', e);
    localStorage.removeItem('moodflix_token');
  }
}`;

const newCode = `async function checkAuth() {
  const token = localStorage.getItem('moodflix_token');
  if (!token) {
    loadMovies();
    return;
  }

  try {
    const res = await fetch(\`\${API_BASE}/auth/me\`, {
      headers: { 'Authorization': \`Bearer \${token}\` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      authToken = token;
      updateAuthUI();
      
      // Run in parallel
      await Promise.allSettled([
        loadMovies(),
        loadPersonalizedRecommendations()
      ]);
    } else {
      console.warn('[checkAuth] Session invalid, removing token');
      localStorage.removeItem('moodflix_token');
      loadMovies();
    }
  } catch (e) {
    console.error('[checkAuth] Error:', e);
    localStorage.removeItem('moodflix_token');
    loadMovies();
  }
}`;

if (content.includes('loadPersonalizedRecommendations();') && !content.includes('Promise.allSettled')) {
  content = content.replace(
    'loadPersonalizedRecommendations();',
    `// Run in parallel
      await Promise.allSettled([
        loadMovies(),
        loadPersonalizedRecommendations()
      ]);`
  );
  fs.writeFileSync('C:\\Users\\Rüzgar\\Desktop\\Moodflix\\public\\js\\app.js', content);
  console.log('Fixed!');
} else {
  console.log('Pattern not found or already fixed');
}
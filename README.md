# Sensoria 🎬

> **Ruh haline göre sinematik film keşfi** — Koyu temalı, modern ve duyarlı bir film öneri platformu.

**Sensoria is an Aevora project.**  
**Aevora — Where ideas evolve.**

![Sensoria Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey)
![Prisma](https://img.shields.io/badge/Prisma-5.22-blue)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📖 Proje Tanımı

**Sensoria**, kullanıcıların o anki ruh hallerine (mood) göre film önerileri sunan, modern bir full-stack web uygulamasıdır. Sinematik bir kullanıcı deneyimi için **Glassmorphism** tasarım dili, **neon mor/kırmızı** aksanlar ve **koyu tema** (Dark Mode) kullanılmıştır.

### ✨ Temel Özellikler

- 🎭 **Mood Tabanlı Keşif**: 15 farklı ruh hali (Exciting, Fun, Dramatic, Scary, Mind-bending, Inspiring, Intense, Captivating, Nostalgic, Chill, Tearjerker, Motivational, Late Night, Suspenseful, Epic)
- 🔍 **Gelişmiş Arama**: Film adı, tür, açıklama ve ruha göre filtreleme
- ❤️ **Favori Sistemi**: JWT korumalı, kullanıcıya özel favori listesi
- 🔐 **Güvenli Kimlik Doğrulama**: bcryptjs şifreleme + JWT token (7 gün)
- 🛡️ **Güvenlik**: Helmet, CORS, Rate Limiting (15dk/100 req/IP)
- 📱 **Tam Duyarlı**: Mobile-first, 4/3/2/1 kolonlu responsive grid
- ⚡ **Performans**: Lazy loading, staggered animations, optimized queries

---

## 🛠️ Kullanılan Teknolojiler

### Backend
| Teknoloji | Sürüm | Kullanım Alanı |
|-----------|-------|----------------|
| **Node.js** | 18+ | Runtime |
| **Express** | 5.x | Web Framework |
| **Prisma ORM** | 5.22 | Database Toolkit |
| **SQLite** | - | Development DB |
| **PostgreSQL** | 15+ | Production DB (Render) |
| **bcryptjs** | 3.x | Password Hashing |
| **jsonwebtoken** | 9.x | JWT Authentication |
| **zod** | 4.x | Schema Validation |
| **helmet** | 8.x | Security Headers |
| **cors** | 2.x | Cross-Origin Requests |
| **express-rate-limit** | 8.x | DDoS Protection |

### Frontend
| Teknoloji | Kullanım Alanı |
|-----------|----------------|
| **Vanilla JS (ES Modules)** | Client-side Logic |
| **CSS Custom Properties** | Theming & Design System |
| **CSS Grid / Flexbox** | Responsive Layout |
| **Glassmorphism** | Visual Effects |
| **Intersection Observer** | Lazy Loading (opsiyonel) |

### DevOps & Deployment
- **Render** (Backend + PostgreSQL) — `render.yaml`
- **Vercel** (Static + Serverless) — `vercel.json`
- **GitHub Actions** ready (CI/CD)

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- npm 9+

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/kullanici/moodflix.git
cd moodflix
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
```bash
cp .env.example .env
# .env dosyasını düzenleyin:
# PORT=3000
# NODE_ENV=development
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-super-secret-key"
```

### 4. Veritabanını Oluşturun
```bash
# Prisma Client generate et
npm run build

# SQLite veritabanını oluştur ve şemayı uygula
npx prisma db push

# (Alternatif) Migration ile:
# npx prisma migrate dev --name init
```

### 5. Örnek Verileri Yükleyin
```bash
npm run seed
```
> 12 popüler film (The Dark Knight, Inception, Parasite, vb.) veritabanına eklenir.

### 6. Sunucuyu Başlatın
```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

### 7. Tarayıcıda Açın
```
http://localhost:3000
```

---

## 📚 API Dokümantasyonu

### Base URL
```
Development: http://localhost:3000/api
Production:  https://moodflix.onrender.com/api
```

### Auth Endpoints
| Method | Endpoint | Açıklama | Korumalı |
|--------|----------|----------|----------|
| POST | `/auth/register` | Yeni kullanıcı kaydı | ❌ |
| POST | `/auth/login` | Giriş yap, token al | ❌ |
| GET | `/auth/me` | Mevcut kullanıcı bilgisi | ✅ |

#### Register Request
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

#### Login Request
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123"
}
```

#### Response (Success)
```json
{
  "message": "Giriş başarılı",
  "user": { "id": "uuid", "email": "user@example.com", "createdAt": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Movie Endpoints (Public)
| Method | Endpoint | Query Params | Açıklama |
|--------|----------|--------------|----------|
| GET | `/movies` | `mood`, `genre`, `search`, `page`, `limit` | Tüm filmler (filtreli) |
| GET | `/movies/:id` | - | Tek film detayı |
| GET | `/movies/recommend/mood` | `mood`, `limit` | Ruha göre öneri |

#### Example Requests
```bash
# Tüm filmler
GET /api/movies

# Mood filtresi + arama
GET /api/movies?mood=Exciting&search=Dark&page=1&limit=12

# Ruha göre öneri (en yüksek puanlı 10 film)
GET /api/movies/recommend/mood?mood=Fun&limit=10
```

#### Response (Movies List)
```json
{
  "movies": [
    {
      "id": "uuid",
      "title": "The Dark Knight",
      "genre": "Action",
      "mood": "Exciting",
      "rating": 9.0,
      "releaseYear": 2008,
      "description": "...",
      "posterUrl": "https://image.tmdb.org/t/p/w500/..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 12,
    "totalPages": 1
  }
}
```

### Favorites Endpoints (Protected)
> **Header gerekli:** `Authorization: Bearer <token>`

| Method | Endpoint | Body | Açıklama |
|--------|----------|------|----------|
| POST | `/favorites` | `{ "movieId": "uuid" }` | Favori ekle |
| DELETE | `/favorites/:movieId` | - | Favori çıkar |
| GET | `/favorites` | - | Kullanıcı favorileri |

#### Add Favorite Request
```json
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": "uuid-of-movie"
}
```

---

## 🗂️ Proje Yapısı

```
moodflix/
├── prisma/
│   ├── schema.prisma      # Veritabanı şeması (User, Movie, Favorite)
│   └── seed.js            # 12 film örnek verisi
├── public/                # Static frontend files
│   ├── index.html         # Ana HTML
│   ├── css/
│   │   └── style.css      # Glassmorphism + Dark Theme
│   └── js/
│       └── app.js         # ES Module frontend logic
├── src/
│   ├── server.js          # Express entry point
│   ├── config/            # Yapılandırma (gelecek)
│   ├── controllers/
│   │   ├── authController.js    # Register, Login, Me
│   │   ├── movieController.js   # Film CRUD + öneri
│   │   └── favoriteController.js# Favori yönetimi
│   ├── middlewares/
│   │   └── authMiddleware.js    # JWT doğrulama
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── movieRoutes.js
│   │   └── favoriteRoutes.js
│   ├── services/          # İş mantığı (gelecek)
│   └── utils/
│       └── auth.js        # bcrypt + JWT helpers
├── .env.example           # Ortam değişkenleri şablonu
├── .gitignore
├── package.json
├── render.yaml            # Render deployment config
├── vercel.json            # Vercel deployment config
└── README.md
```

---

## 🌐 Canlıya Alma (Deployment)

### Option 1: Render (Önerilen - Full Stack + PostgreSQL)

1. **GitHub'a push edin**
2. **Render Dashboard** → New → Blueprint → `render.yaml` seçin
3. **Environment Variables** otomatik ayarlanır:
   - `DATABASE_URL` → PostgreSQL connection string
   - `JWT_SECRET` → Rastgele güvenli değer
4. **Deploy** → Canlı URL: `https://moodflix.onrender.com`

> Render Free Tier: 750 saat/ay, spin-down後 cold start (~30sn)

### Option 2: Vercel (Serverless + Static)

1. **Vercel CLI** veya Dashboard ile import edin
2. `vercel.json` yapılandırması otomatik algılanır
3. **Environment Variables** ekleyin:
   - `DATABASE_URL` → External PostgreSQL (Neon, Supabase, Railway)
   - `JWT_SECRET` → Güvenli rastgele string
4. **Deploy** → Canlı URL: `https://moodflix.vercel.app`

> ⚠️ Vercel'de Express tam uyumlu değil; API routes `/api/*` serverless function olarak çalışır. SQLite dosya sistemi read-only olduğu için **PostgreSQL** zorunludur.

### Option 3: Railway / Fly.io / Docker

```dockerfile
# Dockerfile örneği
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔐 Güvenlik Notları

- **Şifreler**: bcryptjs (12 rounds) ile hash'lenir, asla plain text saklanmaz
- **Token**: JWT HS256, 7 gün geçerli, `httpOnly` cookie alternatifi hazır
- **Rate Limit**: 15 dakikada IP başına 100 istek
- **Headers**: Helmet ile XSS, clickjacking, MIME sniffing koruması
- **Validation**: Zod ile tüm input'lar sunucuda doğrulanır
- **CORS**: Geliştirme için açık, production'da domain whitelist önerilir

---

## 🧪 Test Etme

```bash
# Health check
curl http://localhost:3000/health

# Filmleri listele
curl http://localhost:3000/api/movies

# Kayıt ol
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Giriş yap
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Favori ekle (token ile)
curl -X POST http://localhost:3000/api/favorites \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"movieId":"<MOVIE_UUID>"}'
```

---

## 📝 Lisans

MIT License — Serbest kullanım, değiştirme ve dağıtım.

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Pushlayın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 🏢 Marka

**Sensoria is an Aevora project.**  
**Aevora — Where ideas evolve.**

---

## 📞 İletişim

**Sensoria Team** — Ruh haline göre sinematik keşif.

> *"Film izlemek bir huy değil, bir ruh hali."*
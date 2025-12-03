# Backend API - Laravel 12

**Laravel 12 REST API untuk ITS (Integrated Task System)**

Backend API untuk sistem manajemen tugas terintegrasi menggunakan Laravel 12 dengan arsitektur RESTful API. Sistem ini dirancang untuk menangani 1000+ concurrent users dengan optimasi Redis, caching, dan rate limiting.

## 📋 Requirements

- PHP >= 8.2
- Composer >= 2.0
- Node.js & NPM
- MySQL >= 8.0
- Redis >= 6.0 (untuk production)

## 🚀 Quick Start

### Prerequisites

- PHP >= 8.2
- Composer >= 2.0
- MySQL >= 8.0
- Redis >= 6.0 (untuk production)

### Installation

```bash
# Install dependencies
composer install

# Setup environment
composer run setup:dev  # Development (tidak perlu Redis)
# atau
composer run setup:prod # Production (perlu Redis)

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Storage setup
php artisan storage:link
```

### Development Server

```bash
# Run development server dengan queue worker
composer run dev

# Atau manual
php artisan serve
php artisan queue:listen
```

Server: `http://127.0.0.1:8000`

## 📁 Struktur Direktori

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/  # API Controllers
│   │   ├── Middleware/   # Custom middleware
│   │   └── Requests/     # Form Request validation
│   ├── Models/           # Eloquent models
│   ├── Mail/            # Email classes
│   └── Providers/       # Service providers
├── config/               # Configuration files
├── database/
│   ├── migrations/       # Database migrations
│   └── seeders/         # Database seeders
├── routes/
│   └── api.php          # API routes
└── storage/             # Storage files
```

## 📚 API Endpoints

### Public Routes

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/login` | User login | 10/min |
| POST | `/api/auth/check-session` | Check active session | 20/min |
| POST | `/api/auth/password/reset/request` | Request OTP | 5/min |
| POST | `/api/auth/password/reset/verify` | Verify OTP | 10/min |
| POST | `/api/auth/password/reset` | Reset password | 5/min |

### Protected Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/avatar` | Upload avatar |
| DELETE | `/api/auth/avatar` | Delete avatar |

## 🔐 Authentication

Semua protected routes memerlukan Bearer token:

```
Authorization: Bearer {token}
```

Token expires setelah 24 jam dan dapat di-refresh.

## 🔒 Security

### Password Policy

- Minimal 8 karakter
- Minimal 1 huruf besar (A-Z)
- Minimal 1 huruf kecil (a-z)
- Minimal 1 angka (0-9)
- Minimal 1 karakter khusus (@$!%*#?&)

### Rate Limiting

- **Global API**: 120 requests/minute (semua routes)
- **Login**: 10 requests/minute
- **Password reset**: 5 requests/minute
- **Custom**: 5 failed attempts = 5 minutes lockout

### Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy (production)
- Strict-Transport-Security (HTTPS)

## 🔧 Configuration

### Environment Setup

File `.env` dikelola melalui command:
- `composer run setup:dev` - Setup untuk development (menggunakan database cache, tidak perlu Redis)
- `composer run setup:prod` - Setup untuk production (menggunakan Redis)

**Development (.env.development)**:
```env
APP_ENV=local
APP_DEBUG=true
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
```

**Production (.env.production)**:
```env
APP_ENV=production
APP_DEBUG=false
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Redis Setup (Production)

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Harus return PONG
```

## 💾 Caching

### Development Mode
Menggunakan **Database Cache** (tidak perlu Redis).

```env
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
```

**Features:**
- User data caching (5 menit TTL)
- Rate limiting storage
- Auto-cleanup expired entries
- Cache invalidation pada semua update operations

### Production Mode
Menggunakan **Redis** untuk performa optimal.

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

**Benefits:**
- Lebih cepat dari database cache
- Mendukung 1000+ concurrent users
- Session management yang efisien
- Queue processing yang scalable

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test tests/Feature/AuthTest.php
```

## 📦 Database

### Migrations

```bash
php artisan migrate
php artisan migrate:fresh --seed
```

### Indexes

Database sudah dioptimasi dengan indexes untuk performa optimal:
- Composite indexes untuk query patterns yang umum
- Indexes pada kolom yang sering di-query (email, username, role, is_active)
- Foreign key indexes untuk relationships

## 📝 Environment Variables

File `.env` dikelola melalui command `composer run setup:dev` atau `composer run setup:prod`.

**Lihat section [Configuration](#-configuration) untuk detail setup environment.**

## 👥 Default Users

| Role | Email | Password | Username |
|------|-------|----------|----------|
| Admin | admin@umj.ac.id | admin123 | admin |
| Dekan | dekan@umj.ac.id | dekan123 | dekan |
| Unit | unit@umj.ac.id | unit123 | unit |
| SDM | sdm@umj.ac.id | sdm123 | sdm |

**⚠️ WARNING**: Ganti password default di production!

## 🚀 Production Deployment

### Setup Production Environment

```bash
# Setup production environment (menggunakan Redis)
composer run setup:prod

# Pastikan Redis sudah running
redis-cli ping  # Harus return PONG

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Performance Optimization

Sistem ini sudah dioptimasi untuk menangani 1000+ concurrent users dengan:

- ✅ **Database Connection Pooling** - Optimasi koneksi database
- ✅ **Redis Caching** - Cache, session, dan queue menggunakan Redis
- ✅ **Database Indexing** - Composite indexes untuk query optimization
- ✅ **Eager Loading** - Mengurangi N+1 queries
- ✅ **Query Scopes** - Reusable query patterns
- ✅ **Rate Limiting** - Global 120 req/min untuk mencegah overload
- ✅ **Caching Strategy** - User data caching dengan TTL yang tepat

## 📄 License

MIT License

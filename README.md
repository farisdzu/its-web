# ITS (Integrated Task System)

Sistem manajemen tugas terintegrasi untuk Fakultas Kedokteran dan Kesehatan (FKK) Universitas Muhammadiyah Jakarta.

## 📋 Deskripsi

ITS (Integrated Task System) adalah aplikasi web berbasis **Laravel 12** (Backend) dan **React 19 + TypeScript** (Frontend) yang dirancang untuk mengelola dan memantau penugasan di lingkungan fakultas. Sistem ini mendukung multi-role dengan dashboard khusus untuk setiap peran pengguna.

## ✨ Fitur Utama

### 🔐 Authentication & Authorization

- ✅ **Multi-role Authentication** - Admin, Dekan, Unit, SDM
- ✅ **Single Device Enforcement** - Satu akun hanya bisa login di satu perangkat
- ✅ **Force Logout** - Kemampuan untuk logout dari perangkat lain
- ✅ **Token-based Authentication** - Laravel Sanctum dengan auto-refresh
- ✅ **Password Reset dengan OTP** - Reset password via email OTP
- ✅ **Session Management** - Tracking aktif session per user

### 👤 User Management

- ✅ **Profile Management** - Edit informasi pribadi (nama, email, username, telepon)
- ✅ **Avatar Upload** - Upload dan hapus foto profil
- ✅ **Password Change** - Ubah password dengan validasi kuat
- ✅ **Phone Number Formatting** - Format otomatis nomor telepon Indonesia

### 📊 Dashboard Berbasis Role

#### Admin Dashboard
- Overview sistem lengkap
- Statistik pengguna, tugas, dan unit
- Monitoring sesi aktif
- Grafik performa bulanan
- Tabel tugas dan aktivitas

#### Dekan Dashboard
- Overview tugas fakultas
- Statistik tugas per unit
- Grafik progress tugas
- Daftar tugas prioritas tinggi
- Aktivitas terbaru

#### Unit Dashboard
- Overview tugas unit
- Statistik tugas per status
- Grafik distribusi tugas
- Daftar tugas yang ditugaskan
- Progress tracking

#### SDM Dashboard
- To-do list pribadi
- Tugas aktif dan selesai
- Deadline terdekat
- Riwayat tugas selesai
- Statistik produktivitas

### 🎨 UI/UX Features

- ✅ **Dark Mode Support** - Tema gelap dan terang
- ✅ **Responsive Design** - Mobile, tablet, desktop
- ✅ **Toast Notifications** - Notifikasi sukses yang smooth
- ✅ **Loading States** - Feedback visual untuk semua operasi
- ✅ **Error Handling** - Error messages yang user-friendly
- ✅ **Animations** - Transisi dan animasi yang halus

### 🔒 Security Features

- ✅ **Strong Password Policy** - Minimal 8 karakter dengan kompleksitas
- ✅ **Rate Limiting** - Proteksi terhadap brute force
- ✅ **Security Headers** - XSS, CSRF, Clickjacking protection
- ✅ **Input Validation** - Validasi di frontend dan backend
- ✅ **File Upload Security** - Validasi tipe, ukuran, dan dimensi file

### ⚡ Performance

- ✅ **Redis Caching** - Cache, session, dan queue menggunakan Redis (Production)
- ✅ **Database Caching** - Cache user data untuk performa optimal (Development)
- ✅ **Database Indexing** - Composite indexes untuk query yang cepat
- ✅ **Connection Pooling** - Optimasi koneksi database untuk high concurrency
- ✅ **Eager Loading** - Mengurangi N+1 queries
- ✅ **Query Scopes** - Reusable query patterns untuk optimasi
- ✅ **Rate Limiting** - Global 120 req/min untuk mencegah overload
- ✅ **Code Splitting** - Optimasi bundle size
- ✅ **Lazy Loading** - Route-based code splitting

## 🏗️ Arsitektur

### Tech Stack

**Backend:**
- Laravel 12
- PHP 8.2+
- MySQL/MariaDB
- Redis (Production)
- Laravel Sanctum (Authentication)
- Pest PHP (Testing)

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

### Project Structure

```
its-fkk/
├── backend/              # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   ├── Models/
│   │   └── Mail/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   └── tests/
│
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
│
└── README.md            # Dokumentasi utama (file ini)
```

## 🚀 Quick Start

### Prerequisites

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL/MariaDB
- Git

### Installation

1. **Clone Repository**

```bash
git clone https://github.com/your-username/its-fkk.git
cd its-fkk
```

2. **Setup Backend**

```bash
cd backend
composer install

# Setup environment (development - tidak perlu Redis)
composer run setup:dev

# APP_KEY akan auto-generate saat setup (jika kosong)

# Run migrations
php artisan migrate
php artisan db:seed

# Storage setup
php artisan storage:link
```

3. **Setup Frontend**

```bash
cd ../frontend
npm install
npm run setup:dev
```

4. **Run Development Servers**

```bash
# Terminal 1 - Backend
cd backend
composer run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

5. **Akses Aplikasi**

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`

## 👥 Default Users

Setelah menjalankan seeder, gunakan akun berikut untuk login:

| Role | Email | Password | Username |
|------|-------|----------|----------|
| **Admin** | admin@umj.ac.id | admin123 | admin |
| **Dekan** | dekan@umj.ac.id | dekan123 | dekan |
| **Unit** | unit@umj.ac.id | unit123 | unit |
| **SDM** | sdm@umj.ac.id | sdm123 | sdm |

**⚠️ PENTING**: Ganti semua password default sebelum deployment ke production!

## 📚 Dokumentasi

**📖 [Dokumentasi Lengkap](./docs/README.md)** - Index semua dokumentasi

### Quick Links

#### Development Guides
- **Frontend:** [Development Guide](./docs/frontend/DEVELOPMENT_GUIDE.md) - Panduan lengkap frontend development
- **Backend:** [Best Practices](./docs/backend/BEST_PRACTICES.md) - Panduan standar industri backend

#### Performance & Scalability
- **Scalability:** [Scalability Analysis](./docs/scalability/SCALABILITY_ANALYSIS.md) - Analisis untuk 200+ users

#### Technical Documentation
- **Backend API:** [`backend/README.md`](./backend/README.md) - API endpoints, authentication, setup
- **Frontend:** [`frontend/README.md`](./frontend/README.md) - Frontend structure, components, integration

### Dokumentasi Terorganisir

Semua dokumentasi sekarang terorganisir di folder `docs/`:
```
docs/
├── frontend/          # Frontend Development Guides
├── backend/           # Backend Development Guides  
├── scalability/       # Scalability & Performance
└── README.md          # Documentation Index
```

**Lihat [Documentation Index](./docs/README.md) untuk navigasi lengkap!**

## 🔌 API Endpoints

### Public Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/check-session` - Check active session
- `POST /api/auth/password/reset/request` - Request OTP
- `POST /api/auth/password/reset/verify` - Verify OTP
- `POST /api/auth/password/reset` - Reset password

### Protected Endpoints

- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/avatar` - Upload avatar
- `DELETE /api/auth/avatar` - Delete avatar

**Lihat [`backend/README.md`](./backend/README.md) untuk dokumentasi API lengkap.**

## 🧪 Testing

### Backend Tests

```bash
cd backend
php artisan test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 🛠️ Development

### Code Quality

**Backend:**
```bash
cd backend
vendor/bin/pint
```

**Frontend:**
```bash
cd frontend
npm run lint
```

### Environment Variables

**Backend Environment Setup:**

Gunakan command berikut untuk setup environment:

```bash
# Development (tidak perlu Redis)
cd backend
composer run setup:dev

# Production (perlu Redis)
composer run setup:prod
```

File `.env` akan dibuat otomatis dari `.env.development` atau `.env.production`.

**Development Configuration:**
```env
APP_ENV=local
APP_DEBUG=true
APP_KEY=                    # Auto-generate saat setup
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=epicgsnew20@gmail.com
MAIL_PASSWORD="gpon stlr elhd rmcx"
MAIL_FROM_ADDRESS="epicgsnew20@gmail.com"
MAIL_FROM_NAME="${APP_NAME}"
```

**Production Configuration:**
```env
APP_ENV=production
APP_DEBUG=false
APP_KEY=                    # Auto-generate saat setup
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=epicgsnew20@gmail.com
MAIL_PASSWORD="gpon stlr elhd rmcx"
MAIL_FROM_ADDRESS="epicgsnew20@gmail.com"
MAIL_FROM_NAME="${APP_NAME}"
```

**Fitur Otomatis:**
- ✅ **Auto-generate APP_KEY** - Jika `APP_KEY` kosong, akan di-generate otomatis
- ✅ **Auto-clear cache** - Otomatis clear config, cache, route, dan view cache setelah setup
- ✅ **Email configuration** - Konfigurasi email Gmail sudah ter-setup

**Frontend** (`env.development`):
```env
VITE_API_URL=http://127.0.0.1:8000/api
NODE_ENV=development
```

## 🚀 Deployment

### Production Checklist

**Backend:**
- [ ] Setup production environment: `composer run setup:prod`
- [ ] Install dan setup Redis: `sudo apt-get install redis-server`
- [ ] Pastikan Redis running: `redis-cli ping`
- [ ] APP_KEY sudah auto-generate saat setup (jika kosong)
- [ ] Setup database production
- [ ] Email sudah terkonfigurasi (Gmail SMTP)
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`
- [ ] Setup HTTPS
- [ ] Configure CORS origins
- [ ] Setup queue worker: `php artisan queue:work`

**Frontend:**
- [ ] Update `env.production` dengan production API URL
- [ ] Run `npm run build:prod`
- [ ] Deploy `dist/` folder ke web server
- [ ] Configure reverse proxy (jika perlu)

### Build Commands

**Backend:**
```bash
# Setup production environment
composer run setup:prod

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Frontend:**
```bash
npm run setup:prod
npm run build
```

## 📊 Database Schema

### Main Tables

- `users` - User accounts dengan role-based access
- `active_sessions` - Tracking active sessions per user
- `password_reset_otps` - OTP untuk password reset
- `personal_access_tokens` - Sanctum tokens
- `cache` - Database cache storage

**Lihat [`backend/database/migrations/`](./backend/database/migrations/) untuk schema lengkap.**

## 🔒 Security

### Implemented Security Features

- ✅ Password hashing dengan bcrypt
- ✅ CSRF protection
- ✅ XSS protection
- ✅ SQL injection prevention (Eloquent ORM)
- ✅ Rate limiting pada sensitive endpoints
- ✅ Input validation & sanitization
- ✅ File upload validation
- ✅ Security headers
- ✅ Single device enforcement
- ✅ Token expiration & refresh

## 📈 Performance Optimizations

Sistem ini dirancang untuk menangani **1000+ concurrent users** dengan optimasi berikut:

### Backend Optimizations

- ✅ **Redis Caching** - Cache, session, dan queue menggunakan Redis (Production)
- ✅ **Database Caching** - Cache user data dengan TTL 5 menit (Development)
- ✅ **Database Connection Pooling** - Optimasi koneksi untuk high concurrency
- ✅ **Database Indexing** - Composite indexes untuk query patterns yang umum
- ✅ **Eager Loading** - Mengurangi N+1 queries dengan eager loading
- ✅ **Query Scopes** - Reusable query patterns untuk optimasi
- ✅ **Rate Limiting** - Global 120 requests/minute untuk mencegah overload
- ✅ **Sticky Connections** - Database connection optimization

### Frontend Optimizations

- ✅ **Code Splitting** - Route-based code splitting
- ✅ **Lazy Loading** - Lazy load components dan routes
- ✅ **Asset Optimization** - Optimasi bundle size dengan Vite
- ✅ **Caching Strategy** - API response caching di frontend

### Production Setup

Untuk production, pastikan:
- ✅ Redis sudah diinstall dan running
- ✅ Database indexes sudah dibuat
- ✅ Cache, session, dan queue menggunakan Redis
- ✅ Rate limiting sudah dikonfigurasi

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Commit Guidelines

- Use clear and descriptive commit messages
- Follow conventional commits format
- One feature per commit
- Test before committing

## 📝 License

MIT License - see [LICENSE.md](./frontend/LICENSE.md) for details

## 👨‍💻 Authors

- **Development Team** - FKK UMJ

## 🙏 Acknowledgments

- Laravel Framework
- React Team
- All contributors

## 📞 Support

Untuk pertanyaan atau support, hubungi tim development atau buat issue di repository ini.

---

**ITS (Integrated Task System)** - Sistem Manajemen Tugas Terintegrasi untuk FKK UMJ


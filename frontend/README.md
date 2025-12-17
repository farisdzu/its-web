# Frontend - React 19 + TypeScript + Vite

React frontend untuk ITS (Integrated Task System).

## 📋 Requirements

- Node.js >= 18
- NPM atau Yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Development
npm run setup:dev

# Production
npm run setup:prod
```

### 3. Run Development Server

```bash
npm run start:dev
# atau
npm run setup:dev && npm run dev
```

Server: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build:prod
# atau
npm run setup:prod && npm run build
```

## 🔧 Environment Variables

### VITE_API_URL

- **Development**: `http://127.0.0.1:8000/api`
- **Production**: `https://its.fkkumj.ac.id/api`

### File Environment

- `env.example` - Template
- `env.development` - Development config
- `env.production` - Production config
- `.env` - Generated file (jangan di-commit)

## 📁 Project Structure

```
src/
├── components/     # Reusable components
├── context/        # React Context (Auth, Toast)
├── hooks/          # Custom hooks
├── icons/          # SVG icons
├── layout/         # Layout components
├── pages/          # Page components
├── services/       # API service
└── utils/          # Utility functions
```

## 🔐 Authentication

- React Context untuk state management
- localStorage untuk token persistence
- Automatic token refresh
- Cross-tab synchronization
- Protected routes berdasarkan roles

## 🎨 UI Components

### Toast Notifications

- Success messages only
- Top-right corner
- Auto-dismiss (3 seconds)
- Smooth animations

### Form Components

- `Input` - Text input dengan validation
- `FileInput` - File upload dengan preview
- `Select` - Dropdown select
- `Button` - Button variants (primary, outline)

### Modal Components

- Reusable modal
- Auto-close on outside click
- ESC key support
- Smooth animations

## 📝 API Integration

Semua API calls menggunakan service terpusat:

```typescript
import { authApi } from '../services/api';

// Login
await authApi.login(email, password);

// Get current user
await authApi.me();

// Update profile
await authApi.updateProfile(data);
```

**Features:**
- Automatic token refresh
- Retry logic dengan exponential backoff
- Request timeout (30 seconds)
- Comprehensive error handling

## 🎯 Features

- ✅ Role-based access control (Admin, Dekan, Unit, SDM)
- ✅ User profile management
- ✅ Avatar upload/delete
- ✅ Password change
- ✅ Toast notifications
- ✅ Dark mode support
- ✅ Responsive design

## ⚡ Performance Optimizations

### Preconnect Links (Automatic)
- **Component**: `PreconnectLinks` di `main.tsx`
- **Fungsi**: Otomatis inject preconnect & dns-prefetch ke API server
- **Manfaat**: Mengurangi latency API request ~150-250ms
- **Cara kerja**: Otomatis detect dari `VITE_API_URL` - tidak perlu ubah manual
- **Development**: Preconnect ke `http://127.0.0.1:8000`
- **Production**: Preconnect ke domain production (otomatis dari env)

**Note**: Tidak perlu diubah manual saat production - otomatis menggunakan URL dari environment variable.

## 🛠️ Development

```bash
# Linting
npm run lint

# Dev server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

## 📄 License

MIT License

# Nomad Cafes

A full-stack web application for discovering cafes perfect for remote work and digital nomads. Find cafes with wifi, power outlets, quiet atmosphere, and great coffee.

## Features

- **Cafe Discovery** - Browse and search cafes optimized for remote work
- **Smart Filtering** - Filter by amenities (wifi, power, quiet, food)
- **Reviews & Ratings** - Community-driven reviews and ratings
- **Favorites** - Save your favorite cafes for quick access
- **Multi-language** - English and German support (i18n)
- **Mobile Responsive** - Works on all devices

## Tech Stack

### Backend
- **Framework:** Django 5.1 + Django REST Framework
- **Database:** PostgreSQL
- **Cache:** Redis
- **Auth:** JWT (cookie-based)
- **Email:** Resend / SMTP
- **Jobs:** Django-RQ

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Routing:** React Router v7
- **Styling:** CSS Modules
- **i18n:** i18next
- **Testing:** Vitest + Playwright

## Project Structure

```
nomad-cafe/
├── backend/                 # Django API
│   ├── apps/
│   │   ├── users/          # Authentication & profiles
│   │   ├── cafes/          # Cafe listings & favorites
│   │   ├── reviews/        # Reviews & ratings
│   │   ├── locations/      # Geographic locations
│   │   └── core/           # Shared utilities
│   ├── config/             # Django settings
│   └── templates/          # Email templates
│
└── frontend/               # React SPA
    ├── src/
    │   ├── api/           # API client layer
    │   ├── components/    # React components
    │   ├── contexts/      # Global state
    │   ├── pages/         # Page components
    │   └── lib/           # Utilities & i18n
    └── e2e/               # Playwright tests
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (optional for development)
- Redis (optional for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.template .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.template .env
# Edit .env with your settings

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend unit tests
cd frontend
npm test

# Frontend E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check .

# Frontend linting
cd frontend
npm run lint
```

## Environment Variables

See `.env.example` for a complete list of environment variables. Key configurations:

### Backend
```bash
DJANGO_ENV=development
DJANGO_DEBUG=1
DATABASE_URL=postgres://...    # Leave empty for SQLite
REDIS_URL=redis://...          # Leave empty for memory cache
RESEND_API_KEY=re_...          # For email in production
```

### Frontend
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SENTRY_DSN=...           # Optional: error tracking
```

## Deployment

### DigitalOcean App Platform (Recommended)

**Services required:**
- PostgreSQL (managed database)
- Redis (managed database)
- Resend account (email delivery)
- Sentry account (error tracking, optional)

**Estimated cost:** ~$40/month

### Docker Compose

```bash
# Copy and configure environment
cp .env.example .env

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | Register new user |
| `/api/auth/login/` | POST | Login |
| `/api/auth/logout/` | POST | Logout |
| `/api/cafes/` | GET | List cafes |
| `/api/cafes/{slug}/` | GET | Cafe details |
| `/api/cafes/{slug}/reviews/` | GET/POST | Cafe reviews |
| `/api/favorites/` | GET/POST/DELETE | User favorites |
| `/api/health/` | GET | Health check |

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Frontend  │◄───────►│   Backend   │
│             │         │   (React)   │  JSON   │  (Django)   │
└─────────────┘         └─────────────┘         └──────┬──────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          │            │            │
                                   ┌──────▼──────┐ ┌───▼───┐ ┌──────▼──────┐
                                   │  PostgreSQL │ │ Redis │ │   Worker    │
                                   └─────────────┘ └───────┘ └─────────────┘
```

## Security

- JWT tokens stored in HTTP-only cookies
- CORS configured for allowed origins
- Rate limiting on sensitive endpoints
- Password hashing with Django's PBKDF2
- Security headers (CSP, X-Frame-Options, etc.)
- Input validation and XSS prevention

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

Built with Django, React, and lots of coffee.

# Nomad Cafe API

A RESTful API for discovering cafes optimized for remote work and digital nomads.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.x-green.svg)](https://djangoproject.com)
[![Test Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)](#testing)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Cafe Discovery** - Search and filter cafes by location, amenities, and ratings
- **User Reviews** - Rate cafes on WiFi, power outlets, noise level, and coffee quality
- **Favorites** - Save and organize favorite workspaces
- **Authentication** - Secure JWT-based auth with HTTP-only cookies
- **API Documentation** - OpenAPI 3.0 schema with Swagger UI

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Django 5.x + Django REST Framework |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (SimpleJWT) with HTTP-only cookies |
| Background Jobs | Django-RQ |
| Documentation | drf-spectacular (OpenAPI 3.0) |
| Monitoring | Sentry |

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 16+ (or SQLite for development)
- Redis (optional, falls back to local memory cache)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nomadcafe-api.git
cd nomadcafe-api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Docker

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## API Documentation

Once running, access the API documentation at:

- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register/` | Register new user |
| `POST` | `/api/auth/login/` | Login and receive JWT |
| `POST` | `/api/auth/logout/` | Logout and clear cookies |
| `GET` | `/api/cafes/` | List cafes with filters |
| `GET` | `/api/cafes/{slug}/` | Get cafe details |
| `POST` | `/api/cafes/{id}/reviews/` | Create review |
| `GET` | `/api/locations/` | List locations |
| `GET` | `/api/users/me/` | Get current user profile |
| `GET` | `/api/health/` | Health check |

### Authentication

The API uses JWT tokens stored in HTTP-only cookies:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  -c cookies.txt

# Authenticated request
curl http://localhost:8000/api/users/me/ -b cookies.txt
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Secret key for Django | Required in production |
| `DJANGO_DEBUG` | Enable debug mode | `true` |
| `DJANGO_ENV` | Environment (development/production) | `development` |
| `DATABASE_URL` | PostgreSQL connection string | SQLite |
| `REDIS_URL` | Redis connection string | Local memory cache |
| `SENTRY_DSN` | Sentry error tracking | - |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

See [.env.example](.env.example) for all options.

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=term-missing

# Run specific test file
pytest apps/cafes/tests/test_views.py

# Run with verbose output
pytest -v
```

### Test Coverage

| Module | Coverage |
|--------|----------|
| apps/cafes | 89% |
| apps/core | 75% |
| apps/locations | 91% |
| apps/reviews | 95% |
| apps/users | 95% |
| **Total** | **90%** |

## Project Structure

```
backend/
├── apps/
│   ├── cafes/          # Cafe models, views, serializers
│   ├── core/           # Health checks, middleware, base classes
│   ├── locations/      # Location/city management
│   ├── reviews/        # Cafe reviews
│   └── users/          # User auth, profiles, permissions
├── config/
│   ├── settings.py     # Django settings
│   ├── urls.py         # URL routing
│   └── wsgi.py         # WSGI application
├── tests/              # Integration tests
├── manage.py
├── requirements.txt
└── Dockerfile
```

## Development

### Code Style

```bash
# Format code
black .
isort .

# Lint
flake8
mypy apps/
```

### Database Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

### Background Jobs

```bash
# Start RQ worker
python manage.py rqworker default email

# Monitor queues
python manage.py rqstats
```

## Deployment

### Docker Production

```bash
# Build image
docker build -t nomadcafe-api .

# Run with environment variables
docker run -d \
  -e DJANGO_SECRET_KEY=your-secret-key \
  -e DATABASE_URL=postgres://... \
  -p 8000:8000 \
  nomadcafe-api
```

### Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/api/health/` | Basic health check |
| `/api/ready/` | Database connectivity check |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

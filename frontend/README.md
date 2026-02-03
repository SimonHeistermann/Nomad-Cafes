# Nomad Cafes

A modern web application for discovering cafes optimized for remote work and digital nomads.

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Cafe Discovery** - Browse and search cafes by location and amenities
- **Interactive Maps** - View cafe locations on an interactive map
- **Detailed Ratings** - See ratings for WiFi, power outlets, noise level, and coffee
- **User Reviews** - Read and write reviews for cafes
- **Favorites** - Save your favorite workspaces
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Internationalization** - Multi-language support (EN, DE)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React 19 |
| Language | TypeScript 5.x |
| Build Tool | Vite 7.x |
| Routing | React Router 7 |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| i18n | i18next |
| Testing | Vitest + Playwright |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+ or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nomadcafe-web.git
cd nomadcafe-web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Environment Variables

Create a `.env` file:

```bash
# API URL (development)
VITE_API_URL=http://localhost:8000/api

# API URL (production - relative path for same-origin)
# VITE_API_URL=/api
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:ui` | Run tests with UI |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | Run E2E tests with UI |

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and generated types
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (auth, theme)
│   ├── hooks/          # Custom React hooks
│   ├── i18n/           # Internationalization config
│   ├── pages/          # Page components
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── e2e/                # Playwright E2E tests
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page |
| `/explore` | Explore | Browse all cafes |
| `/listing/:slug` | CafeDetail | Cafe details and reviews |
| `/login` | Login | User login |
| `/register` | Register | User registration |
| `/profile` | Profile | User profile |
| `/favorites` | Favorites | Saved cafes |

## API Integration

The frontend uses a type-safe API client generated from the backend OpenAPI schema:

```bash
# Generate API types from running backend
npm run generate:api

# Generate from local schema file
npm run generate:api:file
```

### Example Usage

```typescript
import { api } from '@/api/client';

// Fetch cafes
const cafes = await api.cafes.list({ location: 'berlin' });

// Get cafe details
const cafe = await api.cafes.get('awesome-cafe-berlin');

// Create review
await api.reviews.create(cafeId, {
  rating_overall: 5,
  rating_wifi: 4,
  text: 'Great place to work!'
});
```

## Testing

### Unit Tests (Vitest)

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test -- --watch
```

### E2E Tests (Playwright)

```bash
# Install browsers (first time)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed
```

### E2E Test Coverage

- Home page navigation
- Cafe discovery flow
- Cafe detail page
- Authentication flows
- Search and filtering
- Error handling
- Accessibility basics

## Styling

The project uses TailwindCSS for styling:

```tsx
// Example component
function CafeCard({ cafe }) {
  return (
    <div className="rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-gray-900">{cafe.name}</h3>
      <p className="text-gray-600">{cafe.address}</p>
    </div>
  );
}
```

## Internationalization

The app supports multiple languages using i18next:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('welcome.title')}</h1>;
}
```

### Extract Translations

```bash
npm run i18n:extract
```

## Docker

### Build Image

```bash
docker build -t nomadcafe-web .
```

### Multi-Stage Build

The Dockerfile uses multi-stage builds:
1. **Builder stage**: Install deps and build with Vite
2. **Production stage**: Serve static files with Nginx

### Run Container

```bash
docker run -d -p 80:80 nomadcafe-web
```

## Deployment

### Static Hosting (Vercel, Netlify)

```bash
# Build
npm run build

# Output in dist/ folder
```

### Docker + Nginx

See [Dockerfile](Dockerfile) for production container setup.

### Environment Variables in Production

For production builds, set environment variables before building:

```bash
VITE_API_URL=/api npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- ESLint for linting
- Prettier for formatting (via ESLint)
- TypeScript strict mode

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

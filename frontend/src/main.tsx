import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/base/variables.css';
import './styles/base/global.css';
import './lib/i18n/config'; // Initialize i18n
import { initSentry } from './lib/sentry'; // Initialize error tracking
import App from './App';

// Initialize Sentry before rendering (must be first)
initSentry();

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container with id "root" not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

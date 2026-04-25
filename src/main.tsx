import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import posthog from 'posthog-js';
import App from './App.tsx';

posthog.init('phc_YAtp0T4XzYF7o0E0zG5vG1p7pZ4e6z2K5I6', {
  api_host: 'https://app.posthog.com',
  person_profiles: 'identified_only',
});

import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available. Reloading...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

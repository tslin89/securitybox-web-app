import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { SignalRProvider } from './contexts/SignalRContext.tsx';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes.tsx'
import { StyledEngineProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';

if ('serviceWorker' in navigator) {
  // Cache-bust in dev so you always fetch the latest SW after edits
  const SW_URL = '/service-worker.js?v=' + Date.now();

  navigator.serviceWorker
    .register(SW_URL, { scope: '/' })
    .then(async (reg) => {
      console.log('[SW] registered:', reg.scope);
      const ready = await navigator.serviceWorker.ready;
      console.log('[SW] ready:', ready.scope);

      // Optional: verify the page is controlled by the SW
      console.log('[SW] controller?', navigator.serviceWorker.controller !== null);
    })
    .catch((err) => {
      console.error('[SW] registration failed:', err);
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <AuthProvider>
        <SignalRProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SignalRProvider>
      </AuthProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);

reportWebVitals();
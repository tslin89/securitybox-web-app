import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { SignalRProvider } from './contexts/SignalRContext.tsx';
import GlobalAlerts from './components/GlobalAlerts';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
    <AuthProvider>
      <SignalRProvider>
        <Router>
          <GlobalAlerts />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
            />
          </Routes>
        </Router>
      </SignalRProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
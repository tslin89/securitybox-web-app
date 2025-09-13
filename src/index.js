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
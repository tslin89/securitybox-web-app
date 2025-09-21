import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Logout() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasLoggedOut.current) return;
    
    hasLoggedOut.current = true;
    
    // Perform logout immediately
    logout();
    
    // Redirect to login page after a short delay
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once

  // Also redirect if user becomes unauthenticated (backup)
  useEffect(() => {
    if (!isAuthenticated && hasLoggedOut.current) {
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="h6" color="text.secondary">
        Logging out...
      </Typography>
    </Box>
  );
}

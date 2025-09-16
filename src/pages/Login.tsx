import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Avatar,
  CircularProgress,
} from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { useNavigate } from 'react-router-dom';

import { UserLogin, ensurePushSubscribed } from '../services/api';
import { useSignalR } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setUseremail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated } = useAuth();
  const { startConnection } = useSignalR();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Autofocus email
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await UserLogin(email, password);
      if (result.status === 1) {
        const loginData = {
          token: result.data?.token || 'dummy-token',
          user: {
            id: result.data?.user?.userID || -1,
            name: result.data?.user?.userName || 'unknown',
            email: result.data?.user?.email || 'unknown',
          },
          expiresIn: result.expiresIn || 24 * 60 * 60, // seconds
        };

        // Save auth
        login(loginData);

        // Start SignalR
        await startConnection();

        // Subscribe push
        await ensurePushSubscribed(loginData.user.id, loginData.token);

        // Go to your first protected page
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!isLoading) handleLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => t.palette.mode === 'light' ? 'grey.50' : 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Paper
          elevation={6}
          sx={{
            maxWidth: 300,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box component="img" src="/logo512.png" alt="Winter Security Box" sx={{ width: 50, height: 'auto', marginBottom: 2 }} />
            </Box>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 600 }}>
              Winter Security System Login
            </Typography>

            <Typography variant="body2" color="text.secondary">
              
            </Typography>
          </Box>

          <Box component="form" noValidate onSubmit={onSubmit}>
            <TextField
              inputRef={emailRef}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setUseremail(e.target.value)}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRoundedIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              label="Password"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit(e as any);
              }}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPass((v) => !v)}
                      edge="end"
                    >
                      {showPass ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3 }}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </Paper>

        {/* Footer (optional) */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 2 }}
        >
          © {new Date().getFullYear()} Team Winter, AUT
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;

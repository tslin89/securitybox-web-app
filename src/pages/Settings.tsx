// src/pages/Settings.tsx
import * as React from 'react';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { ensurePushSubscribed } from '../services/api';
import EventSettings from '../components/EventSettings';
import { useAuth } from '../contexts/AuthContext';
// TODO: implement this in your api service
async function disablePush(userId: number, token: string) {
  // unsubscribe on your server and/or unregister service worker push subscription
  return true;
}

export default function Settings() {
  const [notifEnabled, setNotifEnabled] = React.useState<boolean>(Notification?.permission === 'granted');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user, token } = useAuth();

  const handleToggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
        if (!notifEnabled) {
          // Request browser permission first
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            if (!user?.userID || !token) {
              setMsg({ type: 'error', text: 'User authentication required for push notifications.' });
              return;
            }
            await ensurePushSubscribed(user.userID, token);
            setNotifEnabled(true);
            setMsg({ type: 'success', text: 'Push notifications enabled.' });
          } else {
            setMsg({ type: 'error', text: 'Notification permission denied. Please enable notifications in your browser settings.' });
          }
        } else {
          if (!user?.userID || !token) {
            setMsg({ type: 'error', text: 'User authentication required for push notifications.' });
            return;
          }
          await disablePush(user.userID, token);
          setNotifEnabled(false);
          setMsg({ type: 'success', text: 'Push notifications disabled.' });
        }
    } catch (e) {
      setMsg({ type: 'error', text: 'Could not update notification settings.' });
    } finally {
      setBusy(false);
    }
  };


  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your Winter Security Box preferences.
          </Typography>
        </Stack>

        {msg && (
          <Alert severity={msg.type} sx={{ mb: 2 }}>
            {msg.text}
          </Alert>
        )}

        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Turn on push notifications to get delivery and security alerts instantly.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={notifEnabled}
                onChange={handleToggle}
                disabled={busy || Notification?.permission === 'denied'}
                inputProps={{ 'aria-label': 'Enable push notifications' }}
              />
            }
            label={notifEnabled ? 'Enabled' : 'Disabled'}
          />

        </Paper>

        {/* Event Settings Section */}
        <Box sx={{ mt: 3 }}>
          {user?.userID ? (
            <EventSettings userId={user.userID} />
          ) : (
            <Alert severity="warning">
              User authentication required to load event settings.
            </Alert>
          )}
        </Box>
    </Container>
  );
}

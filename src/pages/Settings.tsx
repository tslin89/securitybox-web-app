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
// TODO: implement this in your api service
async function disablePush(userId: number, token: string) {
  // unsubscribe on your server and/or unregister service worker push subscription
  return true;
}

export default function Settings() {
  const [notifEnabled, setNotifEnabled] = React.useState<boolean>(Notification?.permission === 'granted');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (!notifEnabled) {
        // enable
        // TODO: get actual userId, token from your auth context
        await ensurePushSubscribed(/* userId */ -1, /* token */ 'dummy');
        setNotifEnabled(true);
        setMsg({ type: 'success', text: 'Push notifications enabled.' });
      } else {
        await disablePush(/* userId */ -1, /* token */ 'dummy');
        setNotifEnabled(false);
        setMsg({ type: 'success', text: 'Push notifications disabled.' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Could not update notification settings.' });
    } finally {
      setBusy(false);
    }
  };

  const testPush = async () => {
    setMsg(null);
    try {
      // call your backend to send a test push
      setMsg({ type: 'success', text: 'Test notification requested.' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to send test notification.' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
            Home
          </Link>
          <Typography color="text.primary">Settings</Typography>
        </Breadcrumbs>

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
              disabled={busy}
              inputProps={{ 'aria-label': 'Enable push notifications' }}
            />
          }
          label={notifEnabled ? 'Enabled' : 'Disabled'}
        />

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="contained" disabled={!notifEnabled || busy} onClick={testPush}>
            Send test notification
          </Button>
          <Button
            variant="outlined"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await handleToggle(); // toggles off if currently on
              } finally {
                setBusy(false);
              }
            }}
          >
            {notifEnabled ? 'Disable' : 'Enable'}
          </Button>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Permission: {Notification?.permission ?? 'n/a'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

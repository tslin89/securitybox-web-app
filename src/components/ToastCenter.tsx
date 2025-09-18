import * as React from 'react';
import { Snackbar, Alert, Stack, Box } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { useAlerts } from '../alerts/AlertsProvider';
// import { EVENT_SETS } from '../constants/events';

export default function ToastCenter() {
  const { alerts, dismiss } = useAlerts();
  const toasts = alerts.filter(a => !a.persistent);
  const persistentAlerts = alerts.filter(a => a.persistent);
  
  // Get the last 3 toasts (non-persistent)
  const lastThreeToasts = toasts.slice(-3);

  // If there's no toast to show, render nothing
  if (lastThreeToasts.length === 0 && persistentAlerts.length === 0) return null;

  // Check if an event code is an incident (should not auto-dismiss)
  const isIncident = (message: string): boolean => {
    // Extract event code from message or check if it contains incident keywords
    const incidentKeywords = ['stolen', 'theft', 'incident'];
    return incidentKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  };

  // Get auto-dismiss duration based on event type
  const getAutoHideDuration = (message: string): number | null => {
    // Incidents (C007, C009) should not auto-dismiss
    if (isIncident(message)) {
      return null; // No auto-dismiss
    }
    // All other events auto-dismiss after 5 seconds
    return 5000;
  };

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1400, // Higher than Snackbar default
        maxWidth: 400,
      }}
    >
      {/* Regular toasts (auto-dismiss) */}
      {lastThreeToasts.map((toast, index) => {
        const severity: AlertColor = (toast.severity as AlertColor) ?? 'info';
        const autoHideDuration = getAutoHideDuration(toast.message);
        
        const handleClose = () => dismiss(toast.id);

        return (
          <Snackbar
            key={toast.id}
            open
            autoHideDuration={autoHideDuration}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              position: 'relative',
              transform: 'none',
              '& .MuiSnackbar-root': {
                position: 'relative',
                transform: 'none',
              }
            }}
          >
            <Alert
              onClose={handleClose}
              severity={severity}
              variant="filled"
              sx={{ 
                width: '100%',
                minWidth: 300,
                maxWidth: 400,
              }}
            >
              <Box>
                <Box sx={{ fontWeight: 'medium' }}>
                  {toast.message}
                </Box>
                <Box sx={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.8, 
                  mt: 0.5,
                  fontFamily: 'monospace'
                }}>
                  {toast.timestamp ? new Date(toast.timestamp).toLocaleTimeString() : 'Just now'}
                </Box>
              </Box>
            </Alert>
          </Snackbar>
        );
      })}

      {/* Persistent alerts (no auto-dismiss, error styling) */}
      {persistentAlerts.map((alert) => {
        const severity: AlertColor = (alert.severity as AlertColor) ?? 'error';
        
        const handleClose = () => dismiss(alert.id);

        return (
          <Snackbar
            key={alert.id}
            open
            autoHideDuration={null} // No auto-dismiss
            onClose={undefined} // Disable click-outside dismissal
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            sx={{
              position: 'relative',
              transform: 'none',
              '& .MuiSnackbar-root': {
                position: 'relative',
                transform: 'none',
              }
            }}
          >
            <Alert
              onClose={handleClose}
              severity="error"
              sx={{ 
                width: '100%',
                minWidth: 300,
                maxWidth: 400,
                // Override theme customizations to use default Material-UI error styling
                backgroundColor: '#cd0000', //'error.light',
                color: 'error.contrastText',
                border: '1px solid',
                borderColor: 'error.main',
                '& .MuiAlert-icon': {
                  color: 'white'//
                },
              }}
            >
              <Box>
                <Box sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {alert.message}
                </Box>
                <Box sx={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.9, 
                  mt: 0.5,
                  fontFamily: 'monospace'
                }}>
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                </Box>
              </Box>
            </Alert>
          </Snackbar>
        );
      })}
    </Stack>
  );
}

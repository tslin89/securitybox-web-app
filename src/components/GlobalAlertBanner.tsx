import * as React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseRounded from '@mui/icons-material/CloseRounded';
import Box from '@mui/material/Box';
import { useAlerts } from '../alerts/AlertsProvider';

export default function GlobalAlertBanner() {
  const { alerts, dismiss } = useAlerts();

  // show persistent alerts; you could also show top-N regardless of persistent flag
  const items = alerts.filter((a) => a.persistent);

  if (!items.length) return null;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 1 }}>
      {items.map((a) => (
        <Collapse key={a.id} in>
          <Alert
            severity={a.severity ?? 'error'}
            sx={{ mb: 1, borderRadius: 2 }}
            action={
              <IconButton
                aria-label="close"
                size="small"
                onClick={() => dismiss(a.id)}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            }
          >
            {a.severity === 'error' && <AlertTitle>Attention</AlertTitle>}
            {a.message}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
}

import * as React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import DoDisturbOnRounded from '@mui/icons-material/DoDisturbOnRounded';
import { useSignalR } from '../contexts/SignalRContext';

/**
 * Adjust these to your context shape.
 * Expected: { status: 'connected'|'connecting'|'disconnected'|'error', lastError?: string }
 */
export default function SignalRStatus() {
  const { status, lastError } = useSignalR() as any;

  if (status === 'connected') {
    return <Chip size="small" color="success" icon={<CheckCircleRounded />} label="Live" />;
  }
  if (status === 'connecting') {
    return <Chip size="small" color="warning" icon={<SyncRounded />} label="Connecting…" />;
  }
  if (status === 'error') {
    return (
      <Chip
        size="small"
        color="error"
        icon={<ErrorOutlineRounded />}
        label={lastError ? `Error: ${lastError}` : 'Error'}
      />
    );
  }
  // disconnected
  return <Chip size="small" variant="outlined" color="default" icon={<DoDisturbOnRounded />} label="Offline" />;
}

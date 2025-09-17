import * as React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import SyncRounded from '@mui/icons-material/SyncRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import DoDisturbOnRounded from '@mui/icons-material/DoDisturbOnRounded';
import { useSignalR } from '../contexts/SignalRContext';
import Tooltip from '@mui/material/Tooltip';

/**
 * Adjust these to your context shape.
 * Expected: { status: 'connected'|'connecting'|'disconnected'|'error', lastError?: string }
 */
export default function SignalRStatus() {
  const { status, lastError, forceReconnect } = useSignalR() as any;
  
  // Debug logging
  console.log('🔍 SignalRStatus - status:', status, 'lastError:', lastError);

  if (status === 'connected') {
    return <Chip size="small" color="success" icon={<CheckCircleRounded />} label="Online" />;
  }
  if (status === 'connecting') {
    return <Chip size="small" color="info" icon={<SyncRounded className="spin" />} label="Connecting…" />;
  }

  if (status === 'error') {
    return (
      <Tooltip title="Click to retry connection">
        <Chip
          clickable
          onClick={forceReconnect}
          size="small"
          color="error"
          icon={<ErrorOutlineRounded />}
          label={lastError ? `Error: ${lastError}` : 'Error'}
        />
      </Tooltip>
    );
  }
  // disconnected
  return (
    <Tooltip title="Click to connect">
      <Chip
        clickable
        onClick={forceReconnect}
        size="small"
        variant="outlined"
        color="default"
        icon={<DoDisturbOnRounded />}
        label="Offline"
      />
    </Tooltip>
  );
}

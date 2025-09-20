import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  startFingerprintOnDevice,
  deleteFingerprint,
  checkFingerprintStatus
} from '../services/api';

export interface FingerprintManagerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (fingerprintNum?: number) => void;
  userID: number;
  boxID: number;
  deviceId: string;
  deviceDescription?: string; // Device description to display
  fingerprintNum?: number; // Required for remove operation
  type: 'add' | 'remove';
}

type Status = 'idle' | 'processing' | 'waiting' | 'success' | 'error' | 'timeout';

const FingerprintManager: React.FC<FingerprintManagerProps> = ({
  open,
  onClose,
  onSuccess,
  userID,
  boxID,
  deviceId,
  deviceDescription,
  fingerprintNum,
  type
}) => {
  const [status, setStatus] = useState<Status>('idle');

  // Debug status changes
  useEffect(() => {
    console.log('FingerprintManager status changed to:', status);
  }, [status]);
  const [error, setError] = useState<string | null>(null);
  const [resultFingerprintNum, setResultFingerprintNum] = useState<number | undefined>(undefined);
  const [showDismissButton, setShowDismissButton] = useState(false);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [hasPendingSetup, setHasPendingSetup] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStatus('idle');
      setError(null);
      setResultFingerprintNum(undefined);
      setShowDismissButton(false);
      // Don't reset hasPendingSetup - keep track of pending setup across dialog opens/closes
    }
  }, [open]);

  // Cleanup interval when dialog closes
  useEffect(() => {
    if (!open && checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
  }, [open, checkInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  const handleStartOperation = useCallback(async () => {
    console.log('Starting fingerprint operation:', { type, deviceId, userID, boxID, hasPendingSetup });
    setStatus('processing');
    setError(null);

    try {
      if (type === 'add') {
        // Start fingerprint addition
        console.log('Calling startFingerprintOnDevice...');
        const response = await startFingerprintOnDevice(deviceId, userID, boxID);
        console.log('startFingerprintOnDevice response:', response);

        if (response.status !== 1) {
          const errorMessage = response.message || 'Failed to start fingerprint setup. Please try again.';
          console.error('Fingerprint setup failed:', errorMessage);
          setError(errorMessage);
          setStatus('error');
          return;
        }

        // Start polling for fingerprint registration
        console.log('Setting status to waiting and starting polling...');
        setStatus('waiting');
        setShowDismissButton(true);
        setHasPendingSetup(true);

        const interval = setInterval(async () => {
          try {
            console.log('Checking fingerprint status...');
            const result = await checkFingerprintStatus(userID, boxID);
            console.log('Fingerprint status result:', result);
            if (result.fingerprintNum) {
              console.log('Fingerprint registered successfully:', result.fingerprintNum);
              clearInterval(interval);
              setCheckInterval(null);
              setResultFingerprintNum(result.fingerprintNum);
              setStatus('success');
              setHasPendingSetup(false);

              // Auto-close after 3 seconds
              setTimeout(() => {
                onSuccess?.(result.fingerprintNum);
                onClose();
              }, 3000);
            }
          } catch (err) {
            console.error('Error checking fingerprint status:', err);
          }
        }, 5000);

        setCheckInterval(interval);

        // Cleanup interval after 5 minutes
        setTimeout(() => {
          if (checkInterval) {
            clearInterval(checkInterval);
            setCheckInterval(null);
          }
          if (status === 'waiting') {
            setStatus('timeout');
          }
        }, 300000); // 5 minutes

      } else if (type === 'remove') {
        // Start fingerprint removal
        if (!fingerprintNum) {
          setError('Fingerprint number is required for removal operation');
          setStatus('error');
          return;
        }

        const response = await deleteFingerprint(deviceId, userID, fingerprintNum, boxID);

        if (response.status !== 1) {
          const errorMessage = response.message || 'Failed to remove fingerprint. Please try again.';
          setError(errorMessage);
          setStatus('error');
          return;
        }

        setStatus('success');

        // Auto-close after 2 seconds
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(`Error during fingerprint ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${type} fingerprint. Please try again.`);
      setStatus('error');
      setHasPendingSetup(false);
    }
  }, [type, deviceId, userID, fingerprintNum, boxID, status, onSuccess, onClose, checkInterval, hasPendingSetup]);

  const handleDismiss = useCallback(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
    onClose();
  }, [checkInterval, onClose]);

  const handleClose = useCallback(() => {
    if (status === 'waiting' || status === 'processing') {
      // Don't allow closing during waiting or processing states unless dismissed
      return;
    }
    onClose();
  }, [status, onClose]);


  const getDialogContent = () => {
    if (status === 'success') {
      return (
        <>
          <Box component="img"
            src="/success.png"
            alt="Success"
            sx={{ width: 60, height: 'auto', margin: 1 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            {type === 'add' ? 'Fingerprint Setup Complete!' : 'Fingerprint Removed Successfully!'}
          </Typography>
          <Typography color="text.secondary">
            {type === 'add'
              ? `Fingerprint has been registered successfully. Fingerprint number: ${resultFingerprintNum}`
              : 'Fingerprint has been removed from the device.'
            }
          </Typography>
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography color="text.secondary">
            {type === 'add'
              ? 'Please try again or contact support if the problem persists.'
              : 'Please try again or contact support if the problem persists.'
            }
          </Typography>
        </>
      );
    }

    if (status === 'timeout') {
      return (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Fingerprint setup timed out. Please check the device and try again.
          </Alert>
          <Typography color="text.secondary">
            The operation took longer than expected. You can dismiss this dialog and check the status later.
          </Typography>
        </>
      );
    }

    if (status === 'waiting') {
      return (
        <>
          <Box component="img"
            src="/fingerprint.svg"
            alt="Setup Fingerprint"
            sx={{ width: 60, height: 'auto', margin: 1 }} />
          <Typography variant="h6" gutterBottom>
            {type === 'add'
              ? 'Continue fingerprint setup on IoT device'
              : 'Processing fingerprint removal...'
            }
          </Typography>
          <Typography color="text.secondary">
            {type === 'add'
              ? 'Please follow the instructions on your IoT device to complete the fingerprint registration.'
              : 'Please wait while the fingerprint is being removed from the device.'
            }
          </Typography>
          {type === 'add' && (
            <Typography color="red" sx={{ mt: 1 }}>
              You are safe to dismiss this popup and check back later for fingerprint status.
            </Typography>
          )}
          <CircularProgress size={40} sx={{ mt: 2 }} />
        </>
      );
    }

    if (status === 'processing') {
      return (
        <>
          <Box component="img"
            src="/fingerprint.svg"
            alt="Setup Fingerprint"
            sx={{ width: 60, height: 'auto', margin: 1 }} />
          <Typography variant="h6" gutterBottom>
            {type === 'add'
              ? 'Starting fingerprint setup...'
              : 'Processing fingerprint removal...'
            }
          </Typography>
          <Typography color="text.secondary">
            {type === 'add'
              ? 'Please wait while we initiate the fingerprint registration process on your IoT device.'
              : 'Please wait while we process the fingerprint removal request.'
            }
          </Typography>
          <CircularProgress size={40} sx={{ mt: 2 }} />
        </>
      );
    }

    // Initial state
    return (
      <>
        <Typography variant="h6" gutterBottom>
          {type === 'add' ? 'Add Fingerprint' : 'Remove Fingerprint'}
        </Typography>
        {hasPendingSetup && type === 'add' ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              There is already a pending fingerprint setup for this user. Sending another signal will restart the process.
            </Alert>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              This will send a new fingerprint registration signal for user ID on {deviceDescription || 'device'} ({deviceId}).
              The previous setup will be replaced.
            </Typography>
          </>
        ) : (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {type === 'add'
              ? `This will start the fingerprint registration process for user ID on ${deviceDescription || 'device'} (${deviceId}).`
              : `This will remove fingerprint number ${fingerprintNum} for user ID from ${deviceDescription || 'device'} (${deviceId}).`
            }
          </Typography>
        )}
        {type === 'remove' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The fingerprint will be permanently removed from the device.
          </Alert>
        )}
      </>
    );
  };

  const getDialogActions = () => {
    if (status === 'success' || status === 'timeout') {
      return (
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 120 }
          }}
        >
          Close
        </Button>
      );
    }

    if (status === 'error') {
      return (
        <>
          <Button
            onClick={onClose}
            color="primary"
            sx={{
              width: { xs: '100%', md: 'auto' },
              minWidth: { md: 120 }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartOperation}
            variant="contained"
            color="primary"
            sx={{
              width: { xs: '100%', md: 'auto' },
              minWidth: { md: 120 }
            }}
          >
            Try Again
          </Button>

        </>
      );
    }

    if (status === 'processing') {
      return (
        <Button
          color="primary"
          onClick={onClose}
          sx={{
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 120 }
          }}
        >
          Cancel
        </Button>
      );
    }

    if (status === 'waiting') {
      return (
        <Button
          variant="outlined"
          onClick={handleDismiss}
          disabled={!showDismissButton}
          sx={{
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 120 }
          }}
        >
          Dismiss
        </Button>
      );
    }

    // Initial state
    return (
      <>
        <Button
          onClick={onClose}
          color="primary"
          sx={{
            width: { xs: '100%',  md: 'auto' },
            minWidth: { md: 120 }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartOperation}
          variant="contained"
          color={type === 'remove' ? 'error' : 'primary'}
          disabled={false}
          sx={{
            width: { xs: '100%', md: 'auto' },
            minWidth: { md: 120 }
          }}
        >
          {type === 'add'
            ? (hasPendingSetup ? 'Restart Setup' : 'Start Setup')
            : 'Remove Fingerprint'
          }
        </Button>

      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={status === 'waiting' || status === 'processing'}
    >
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        {getDialogContent()}
      </DialogContent>
      <DialogActions sx={{
        justifyContent: 'center',
        pb: 3,
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1, md: 2 },
        px: { xs: 2, md: 3 }
      }}>
        {getDialogActions()}
      </DialogActions>
    </Dialog>
  );
};

export default FingerprintManager;

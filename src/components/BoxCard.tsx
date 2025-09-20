import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  Divider,
} from '@mui/material';
import {
  LockOpen as LockOpenIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Scale as ScaleIcon,
  Schedule as ScheduleIcon,
  Fingerprint as FingerprintIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { BoxData, unlockDevice } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FingerprintManager from './FingerprintManager';
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed';

interface BoxCardProps {
  box: BoxData;
  onRefresh: (boxId: number) => void;
}

export default function BoxCard({ box, onRefresh }: BoxCardProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showFingerprintDialog, setShowFingerprintDialog] = useState(false);

  const handleRefresh = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      await onRefresh(box.boxID);
    } catch (error) {
      console.error('Failed to refresh box data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) return;

    setIsUnlocking(true);
    try {

      const response = await unlockDevice(box.deviceID, user.userID, box.boxID);
      if (response.status === 1) {
        setSnackbarMessage('Pause security command sent successfully to selected device.');
        setSnackbarOpen(true);
      }
      else {
        setSnackbarMessage(response.message);
        setSnackbarOpen(true);
      }

    } catch (error) {
      console.error('Failed to pause security on selected device:', error);
      setSnackbarMessage('Failed to pause security on selected device');
      setSnackbarOpen(true);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleFingerprintSuccess = (fingerprintNum?: number) => {
    setSnackbarMessage(
      fingerprintNum 
        ? `Fingerprint registered successfully! Number: ${fingerprintNum}`
        : 'Fingerprint removed successfully!'
    );
    setSnackbarOpen(true);
    setShowFingerprintDialog(false);
    // Refresh the box data to get updated fingerprint status
    onRefresh(box.boxID);
  };

  const handleFingerprintClick = () => {
    setShowFingerprintDialog(true);
  };

  const isFingerprintEnabled = (user as any)?.fingerprintEnabled ?? false;
  const hasUserFingerprint = box.userFingerprintNum > 0;

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return 'Unknown';
    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getDoorStateInfo = () => {
    if (box.doorState === null) return { text: 'Unknown', color: 'default' as const };
    return box.doorState === 1
      ? { text: 'Opened', color: 'error' as const }
      : { text: 'Closed', color: 'success' as const };
  };

  const getBoxPositionInfo = () => {
    if (box.boxPosition === null) return { text: 'Unknown', color: 'default' as const };
    return box.boxPosition === 1
      ? { text: 'In place', color: 'success' as const }
      : { text: 'Stolen', color: 'error' as const };
  };

  const getWeightInfo = () => {
    if (box.totalWeight === null) return { text: 'Unknown', color: 'default' as const };
    return { text: `${box.totalWeight}g`, color: 'primary' as const };
  };

  const doorState = getDoorStateInfo();
  const boxPosition = getBoxPositionInfo();
  const weightInfo = getWeightInfo();
  const isDataAvailable = box.receivedTime !== null;

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header with device icon and name */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              component="img"
              src="/chipset.png"
              alt="Winter Security Box"
              sx={{
                width: { xs: 40 },
                height: 'auto',
                mr: 1.5,
                filter: isDataAvailable ? 'none' : 'grayscale(100%)',
                opacity: isDataAvailable ? 1 : 0.6,
                transition: 'all 0.3s ease'
              }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {box.boxDescription}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {box.deviceID}
              </Typography>
            </Box>
          </Box>

          {/* Status Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Door State */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                Door:
              </Typography>
              <Chip
                label={doorState.text}
                color={doorState.color}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Box Position */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GpsNotFixedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                Box Position:
              </Typography>
              <Chip
                label={boxPosition.text}
                color={boxPosition.color}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Weight */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScaleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                Weight:
              </Typography>
              <Chip
                label={weightInfo.text}
                color={weightInfo.color}
                size="small"
                variant="outlined"
              />
            </Box>

            {/* Received Time - Only show if receivedTime has value */}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                Last Updated:
              </Typography>
              <Chip
                label={formatDateTime(box.receivedTime)}
                color={isDataAvailable ? 'primary' : 'default'}
                size="small"
                variant="outlined"
              />
            </Box>

            {isFingerprintEnabled && (
              <>
                <Divider />

                {/* Fingerprint Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FingerprintIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                    Fingerprint:
                  </Typography>
                  {hasUserFingerprint ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`Registered`}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                      <IconButton
                        size="small"
                        onClick={handleFingerprintClick}
                        color="error"
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={handleFingerprintClick}
                      size="small"
                      sx={{ 
                        textTransform: 'none',
                        minWidth: 'auto',
                        p: 0.5,
                        fontSize: '0.75rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Register
                    </Button>
                  )}
                </Box>

                <Divider />
              </>
            )}

          </Box>
        </CardContent>

       

        <CardActions sx={{ pt: 0, px: 0, pb: 0, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={isUnlocking ? <CircularProgress size={16} /> : <LockOpenIcon />}
            onClick={handleUnlock}
            disabled={isUnlocking}
            size="small"
          >
            {isUnlocking ? 'Pausing...' : 'Pause Security'}
          </Button>

          <IconButton
            onClick={handleRefresh}
            disabled={isRefreshing}
            color="primary"
            size="small"
          >
            {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </CardActions>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Fingerprint Manager Dialog */}
      <FingerprintManager
        open={showFingerprintDialog}
        onClose={() => setShowFingerprintDialog(false)}
        onSuccess={handleFingerprintSuccess}
        userID={box.userID}
        boxID={box.boxID}
        deviceId={box.deviceID}
        deviceDescription={box.boxDescription}
        fingerprintNum={hasUserFingerprint ? box.userFingerprintNum : undefined}
        type={hasUserFingerprint ? 'remove' : 'add'}
      />
    </>
  );
}

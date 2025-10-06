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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import { BoxData, disableSecurity, enableSecurity } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FingerprintManager from './FingerprintManager';
import { formatDateTime } from '../utils/dateFormatter';
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
  const [showDisableConfirmDialog, setShowDisableConfirmDialog] = useState(false);

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

  const handleSecurityToggle = () => {
    if (!user) return;

    // Default to enabled (1) if securityStatus is null/undefined
    const isSecurityEnabled = box.securityStatus === 1;
    
    if (isSecurityEnabled) {
      // Show confirmation dialog for disable action
      setShowDisableConfirmDialog(true);
    } else {
      // Enable security directly (no confirmation needed)
      executeSecurityToggle();
    }
  };

  const executeSecurityToggle = async () => {
    if (!user) return;

    setIsUnlocking(true);
    setShowDisableConfirmDialog(false);
    
    try {
      // Default to enabled (1) if securityStatus is null/undefined
      const isSecurityEnabled = box.securityStatus === 1;
      const response = isSecurityEnabled 
        ? await disableSecurity(box.deviceID, user.userID, box.boxID)
        : await enableSecurity(box.deviceID, user.userID, box.boxID);

      if (response.status === 1) {
        const action = isSecurityEnabled ? 'disable' : 'enable';
        setSnackbarMessage(`${action === 'disable' ? 'Disable' : 'Enable'} security command sent successfully to selected device.`);
        setSnackbarOpen(true);
      }
      else {
        setSnackbarMessage(response.message);
        setSnackbarOpen(true);
      }

    } catch (error) {
      const action = box.securityStatus === 1 ? 'disable' : 'enable';
      console.error(`Failed to ${action} security on selected device:`, error);
      setSnackbarMessage(`Failed to ${action} security on selected device`);
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


  const getDoorStateInfo = () => {
    if (box.doorState === null) return { text: 'Unknown', color: 'default' as const };
    return box.doorState === 1
      ? { text: 'Opened', color: 'error' as const }
      : { text: 'Closed', color: 'success' as const };
  };

  const getBoxPositionInfo = () => {
    if (box.boxPosition === null) return { text: 'Unknown', color: 'default' as const };
    return box.boxPosition === 1
      ? { text: 'Stolen', color: 'error' as const }
      : { text: 'In place', color: 'success' as const };
  };

  const getWeightInfo = () => {
    if (box.totalWeight === null) return { text: 'Unknown', color: 'default' as const };
    return { text: `${box.totalWeight}g`, color: 'primary' as const };
  };

  const doorState = getDoorStateInfo();
  const boxPosition = getBoxPositionInfo();
  const weightInfo = getWeightInfo();
  const isDataAvailable = box.timeStamp !== null;

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          border: box.securityStatus === 0 
            ? `1px solid ${theme.palette.error.main}` 
            : `1px solid ${theme.palette.divider}`,
          boxShadow: box.securityStatus === 0 
            ? `0 0 0 1px ${theme.palette.error.main}` 
            : 'none',
          transition: 'all 0.3s ease',
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

            {/* Security Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SecurityIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: '80px', flexGrow: 1 }}>
                Security:
              </Typography>
              <Chip
                label={box.securityStatus === 1 ? 'Enabled' : 'Disabled'}
                color={box.securityStatus === 1 ? 'success' : 'error'}
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
                label={formatDateTime(box.timeStamp)}
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
            variant="contained"
            color={box.securityStatus === 1 ? 'error' : 'success'}
            startIcon={isUnlocking ? <CircularProgress size={16} /> : (box.securityStatus === 1 ? <LockOpenIcon /> : <SecurityIcon />)}
            onClick={handleSecurityToggle}
            disabled={isUnlocking}
            size="small"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: box.securityStatus === 1 
                ? '0 2px 8px rgba(211, 47, 47, 0.3)' 
                : '0 2px 8px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                boxShadow: box.securityStatus === 1 
                  ? '0 4px 12px rgba(211, 47, 47, 0.4)' 
                  : '0 4px 12px rgba(76, 175, 80, 0.4)',
              }
            }}
          >
            {isUnlocking 
              ? (box.securityStatus === 1 ? 'Disabling...' : 'Enabling...') 
              : (box.securityStatus === 1 ? 'Disable Security' : 'Enable Security')
            }
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

      {/* Disable Security Confirmation Dialog */}
      <Dialog
        open={showDisableConfirmDialog}
        onClose={() => setShowDisableConfirmDialog(false)}
        aria-labelledby="disable-security-dialog-title"
        aria-describedby="disable-security-dialog-description"
      >
        <DialogTitle id="disable-security-dialog-title">
          Disable Security Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="disable-security-dialog-description">
          This action will turn off the security monitoring for this device.
            <br />
            Are you sure you want to disable security feature on this device?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDisableConfirmDialog(false)}
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={executeSecurityToggle}
            color="error"
            variant="contained"
            autoFocus
          >
            Disable Security
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { createUser, checkFingerprintStatus, startFingerprintOnDevice } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Mock API function - replace with actual import
// const createUser = async (userData: any) => {
//   console.log('Creating user:', userData);
//   return { userID: Math.random(), message: 'User created successfully' };
// };

// const checkFingerprintStatus = async (userId: number) => {
//   // Simulate fingerprint setup process
//   await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
//   return { fingerprintNum: Math.floor(Math.random() * 100000) };
// };

interface AddUserProps {
  onSuccess?: (userId: number) => void;
  onCancel?: () => void;
}

const AddUser: React.FC<AddUserProps> = ({ onSuccess, onCancel }) => {
  const theme = useTheme();
  const { boxList } = useAuth();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: '',
    userType: 2,
    boxID: 0,
    fingerprintEnabled: false,
    isEnabled: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFingerprintPopover, setShowFingerprintPopover] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);
  const [selectedBox, setSelectedBox] = useState<any>(null);
  const [showDismissButton, setShowDismissButton] = useState(false);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  const textFieldStyles = {
    '& .MuiFilledInput-root': {
      backgroundColor: theme.palette.mode === 'dark'
        ? '#424242'  // Dark gray for dark mode
        : theme.palette.background.paper,  // Light background for light mode
      borderRadius: '8px',
      border: `1px solid ${theme.palette.divider}`,
      '&:before': {
        borderBottom: 'none',
      },
      '&:after': {
        borderBottom: 'none',
      },
      '&:hover:not(.Mui-disabled):before': {
        borderBottom: 'none',
      },
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.mode === 'dark'
          ? '#616161'  // Slightly lighter on hover in dark mode
          : theme.palette.background.paper,
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1px',  // Keep same border width to prevent layout shift
        backgroundColor: theme.palette.mode === 'dark'
          ? '#616161'  // Slightly lighter when focused in dark mode
          : theme.palette.background.paper,
      },
    },
    '& .MuiFilledInput-underline:before': {
      borderBottom: 'none',
    },
    '& .MuiFilledInput-underline:after': {
      borderBottom: 'none',
    },
    '& .MuiFilledInput-underline:hover:not(.Mui-disabled):before': {
      borderBottom: 'none',
    },
    // Additional selectors to override Material-UI's internal styling
    '& .MuiFilledInput-input': {
      backgroundColor: 'transparent',
    },
    '& .MuiInputBase-input': {
      backgroundColor: 'transparent',
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              (name === 'userType' || name === 'boxID') ? Number(value) : value
    }));
  };

  const handleToggleChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const handleBoxChange = (boxID: number) => {
    const box = boxList.find(b => b.boxID === boxID);
    setSelectedBox(box);
    setFormData(prev => ({
      ...prev,
      boxID: boxID
    }));
  };

  const validateForm = () => {
    if (!formData.userName.trim()) return 'User Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email format';
    if (!formData.password.trim()) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (formData.boxID === 0) return 'Please select a box';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const { userID } = await createUser({
        userName: formData.userName,
        email: formData.email,
        phoneNo: formData.phoneNo || undefined,
        password: formData.password,
        userType: formData.userType,
        boxID: formData.boxID,
        fingerprintEnabled: formData.fingerprintEnabled,
        isEnabled: formData.isEnabled
      });

      if (formData.fingerprintEnabled) {
        setShowFingerprintPopover(true);
        startFingerprintSetup(userID);
      } else {
        onSuccess?.(userID);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const startFingerprintSetup = async (userId: number) => {
    setFingerprintLoading(true);
    setShowDismissButton(true); // Enable dismiss button immediately

    console.log('Sending fingerprint setup signal to IoT device for user:', userId);

    // Start fingerprint setup
    try {
      await startFingerprintOnDevice(selectedBox?.deviceID || "demo-device-raspberrypi", userId);
    } catch (err) {
      console.error('Error starting fingerprint setup:', err);
      setFingerprintLoading(false);
      setError('Failed to start fingerprint setup. Please try again.');
      return;
    }

    // Simulate periodic checking for fingerprint registration
    const interval = setInterval(async () => {
      try {
        const result = await checkFingerprintStatus(userId);
        if (result.fingerprintNum) {
          clearInterval(interval);
          setCheckInterval(null);
          setFingerprintLoading(false);
          setFingerprintSuccess(true);
          setTimeout(() => {
            setShowFingerprintPopover(false);
            onSuccess?.(userId);
          }, 3000);
        }
      } catch (err) {
        console.error('Error checking fingerprint status:', err);
      }
    }, 5000);

    setCheckInterval(interval);

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setCheckInterval(null);
      }
      if (fingerprintLoading) {
        setFingerprintLoading(false);
        setError('Fingerprint setup timeout. Please try again.');
      }
    }, 300000);
  };

  const handleDismiss = () => {
    // Clear the interval when dismissing
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
    setShowFingerprintPopover(false);
    // Navigate back to user list immediately
    onSuccess?.(0); // Pass 0 as placeholder userId since we're dismissing
  };


  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  return (
    <>
      <Box sx={{
        padding: { xs: 2, sm: 3 },
        maxWidth: { xs: '100%', sm: 600 },
        margin: '0 auto'
      }}>
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Add New User
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* Box Selection - Top Row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
                mb: 2
              }}>
                <FormControl fullWidth variant="filled" sx={textFieldStyles}>
                  <InputLabel>Select Box</InputLabel>
                  <Select
                    value={formData.boxID}
                    onChange={(e) => handleBoxChange(Number(e.target.value))}
                    label="Select Box"
                  >
                    <MenuItem value={0}>
                      <em>Please select a box</em>
                    </MenuItem>
                    {boxList.map((box) => (
                      <MenuItem key={box.boxID} value={box.boxID}>
                        {box.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedBox && (
                  <TextField
                    fullWidth
                    label="Device ID"
                    value={selectedBox.deviceID}
                    variant="filled"
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{
                      ...textFieldStyles,
                      '& .MuiFilledInput-root': {
                        ...textFieldStyles['& .MuiFilledInput-root'],
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? '#2e2e2e'  // Darker background for read-only
                          : '#f5f5f5', // Light gray background for read-only
                        cursor: 'default',
                      },
                    }}
                  />
                )}
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
                mb: 2
              }}>
                <TextField
                  fullWidth
                  label="User Name"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  required
                  variant="filled"
                  sx={textFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  variant="filled"
                  sx={textFieldStyles}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNo"
                  type="tel"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  variant="filled"
                  sx={textFieldStyles}
                />
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
                mb: 2
              }}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  variant="filled"
                  sx={textFieldStyles}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  variant="filled"
                  sx={textFieldStyles}
                />
              </Box>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr' },
                gap: 2,
                mb: 2
              }}>
                <TextField
                  fullWidth
                  select
                  label="User Type"
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  variant="filled"
                  sx={textFieldStyles}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value={1}>Admin</option>
                  <option value={2}>User</option>
                </TextField>
              </Box>


              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 2
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.fingerprintEnabled}
                      onChange={() => handleToggleChange('fingerprintEnabled')}
                      color="primary"
                    />
                  }
                  label="Fingerprint Enabled"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isEnabled}
                      onChange={() => handleToggleChange('isEnabled')}
                      color="primary"
                    />
                  }
                  label="User Enabled"
                />
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="flex-end"
                sx={{ mt: 3, mb: 3 }}
              >
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                  sx={{
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Fingerprint Setup Dialog */}
      <Dialog
        open={showFingerprintPopover}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          {fingerprintSuccess ? 'Fingerprint Setup Complete!' : 'Fingerprint Setup'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {fingerprintSuccess ? (
            <>
              <Box component="img" src="/success.png" alt="Setup Fingerprint" sx={{ width: 60, height: 'auto', margin: 1 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Fingerprint Setup Complete!
              </Typography>
              <Typography color="text.secondary">
                User has been created successfully with fingerprint registration.
              </Typography>
            </>
          ) : (
            <>
              <Box component="img" src="/fingerprint.svg" alt="Setup Fingerprint" sx={{ width: 60, height: 'auto', margin: 1 }} />
              <Typography variant="h6" gutterBottom>
                Continue fingerprint setup on IoT device
              </Typography>
              <Typography color="text.secondary">
                Please follow the instructions on your IoT device to complete the fingerprint registration.
              </Typography>
              <Typography color="red">
                You are safe to dismiss this popup and check back later for fingerprint status in User Management.
              </Typography>
              <CircularProgress size={40} sx={{ mt: 2 }}/>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleDismiss}
                  disabled={!showDismissButton}
                  sx={{ minWidth: 120 }}
                >
                  Dismiss
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
};

export default AddUser;
import { updateUser, getUser, checkFingerprintStatus, startFingerprintOnDevice } from '../services/api';
import React, { useState, useEffect } from 'react';
import { useFingerprintSetup } from "../hooks/useFingerprintSetup";

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
  Chip
} from '@mui/material';

// Mock API functions - replace with actual imports
// const getUser = async (userId: number) => {
//   return {
//     userID: userId,
//     userName: 'John Doe',
//     email: 'john@example.com',
//     phoneNo: '123-456-7890',
//     userType: 1,
//     fingerprintNum: 12345,
//     fingerprintEnabled: true,
//     userEnabled: true
//   };
// };

// const updateUser = async (userId: number, userData: any) => {
//   console.log('Updating user:', userId, userData);
//   return { message: 'User updated successfully' };
// };

// const checkFingerprintStatus = async (userId: number) => {
//   // Simulate fingerprint setup process
//   await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 2000));
//   return { fingerprintNum: Math.floor(Math.random() * 100000) };
// };

interface User {
  userID: number;
  userName: string;
  email: string;
  phoneNo?: string;
  userType: number;
  fingerprintNum?: number;
  fingerprintEnabled?: boolean;
  userEnabled?: boolean;
}

interface UpdateUserProps {
  userId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const UpdateUser: React.FC<UpdateUserProps> = ({ userId, onSuccess, onCancel }) => {

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: '',
    userType: 2,
    fingerprintEnabled: false,
    userEnabled: true
  });

  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFingerprintPopover, setShowFingerprintPopover] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'white',
    },
    '& .MuiInputLabel-root': {
      backgroundColor: 'white',
      paddingLeft: '4px',
      paddingRight: '4px',
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoadingUser(true);
      const user = await getUser(userId);
      setOriginalUser(user);
      setFormData({
        userName: user.userName,
        email: user.email,
        phoneNo: user.phoneNo || '',
        password: '',
        confirmPassword: '',
        userType: user.userType,
        fingerprintEnabled: user.fingerprintEnabled || false,
        userEnabled: user.userEnabled || true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleToggleChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev]
    }));
  };

  const validateForm = () => {
    if (!formData.userName.trim()) return 'User Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Invalid email format';
    if (changePassword) {
      if (!formData.password.trim()) return 'Password is required';
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('update user handle submit')
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const updateData: any = {
        userID: userId,
        userName: formData.userName,
        email: formData.email,
        phoneNo: formData.phoneNo || undefined,
        userType: formData.userType,
        fingerprintEnabled: formData.fingerprintEnabled,
        userEnabled: formData.userEnabled
      };

      if (changePassword) {
        updateData.password = formData.password;
      }

      await updateUser(userId, updateData);

      // Check if fingerprint was newly enabled and needs setup
      const needsFingerprintSetup = formData.fingerprintEnabled &&
        (!originalUser?.fingerprintEnabled || !originalUser?.fingerprintNum);

      if (needsFingerprintSetup) {
        setShowFingerprintPopover(true);
        startFingerprintSetup();
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const startFingerprintSetup = async () => {
    setFingerprintLoading(true);

    // TODO: Send signal to IoT device via IoT Hub
    console.log('Sending fingerprint setup signal to IoT device for user:', userId);

    // Start fingerprint setup
    startFingerprintOnDevice("demo-device-raspberrypi", userId)

    // Simulate periodic checking for fingerprint registration
    const checkInterval = setInterval(async () => {
      try {
        const result = await checkFingerprintStatus(userId);
        if (result.fingerprintNum && result.fingerprintNum !== originalUser?.fingerprintNum) {
          clearInterval(checkInterval);
          setFingerprintLoading(false);
          setFingerprintSuccess(true);
          setTimeout(() => {
            setShowFingerprintPopover(false);
            onSuccess?.();
          }, 2000);
        }
      } catch (err) {
        console.error('Error checking fingerprint status:', err);
      }
    }, 5000);

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (fingerprintLoading) {
        setFingerprintLoading(false);
        setError('Fingerprint setup timeout. Please try again.');
      }
    }, 300000);
  };


  if (loadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto' }}>
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Update User
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              User ID: {userId}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="User Name"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    sx={textFieldStyles}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    sx={textFieldStyles}
                  />
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={handleInputChange}
                variant="outlined"
                sx={{ mb: 2, ...textFieldStyles }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={changePassword}
                    onChange={() => setChangePassword(!changePassword)}
                    color="primary"
                  />
                }
                label="Change Password"
                sx={{ mb: 2 }}
              />

              {changePassword && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      sx={textFieldStyles}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      variant="outlined"
                      sx={textFieldStyles}
                    />
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                select
                label="User Type"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                variant="outlined"
                sx={{ mb: 2, ...textFieldStyles }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value={1}>Admin</option>
                <option value={2}>User</option>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.fingerprintEnabled}
                    onChange={() => handleToggleChange('fingerprintEnabled')}
                    color="primary"
                  />
                }
                label="Fingerprint Enabled"
                sx={{ mb: 2 }}
              />

              {originalUser?.fingerprintNum && (
                <Box sx={{
                  backgroundColor: 'grey.100',
                  padding: 2,
                  borderRadius: 1,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Chip
                    label={`Fingerprint ID: ${originalUser.fingerprintNum}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.userEnabled}
                    onChange={() => handleToggleChange('userEnabled')}
                    color="primary"
                  />
                }
                label="User Enabled"
                sx={{ mb: 2 }}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Updating...' : 'Update User'}
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
          {fingerprintSuccess ? 'Fingerprint Updated Successfully!' : 'Fingerprint Setup'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {fingerprintSuccess ? (
            <>
              <Box component="img" src="/success.png" alt="Setup Fingerprint" sx={{ width: 60, height: 'auto', margin: 1 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Fingerprint Updated Successfully!
              </Typography>
              <Typography color="text.secondary">
                User fingerprint has been registered successfully.
              </Typography>
            </>
          ) : (
            <>
              <Box component="img" src="/fingerprint.svg" alt="Setup Fingerprint" sx={{ width: 60, height: 'auto', margin: 1 }} />
              <Typography variant="h6" gutterBottom>
                Continue fingerprint setup on IoT device
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Please follow the instructions on your IoT device to complete the fingerprint registration.
              </Typography>
              <CircularProgress size={40} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpdateUser;
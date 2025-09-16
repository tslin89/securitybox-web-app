import React, { useState } from 'react';
import { createUser, checkFingerprintStatus } from '../services/api';
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
  Stack
} from '@mui/material';

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFingerprintPopover, setShowFingerprintPopover] = useState(false);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);
  const [newUserId, setNewUserId] = useState<number | null>(null);

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
    if (!formData.password.trim()) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
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
        fingerprintEnabled: formData.fingerprintEnabled,
        userEnabled: formData.userEnabled
      });

      setNewUserId(userID);

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

    console.log('Sending fingerprint setup signal to IoT device for user:', userId);

    // Simulate periodic checking for fingerprint registration
    const checkInterval = setInterval(async () => {
      try {
        const result = await checkFingerprintStatus(userId);
        if (result.fingerprintNum) {
          clearInterval(checkInterval);
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

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      if (fingerprintLoading) {
        setFingerprintLoading(false);
        setError('Fingerprint setup timeout. Please try again.');
      }
    }, 300000);
  };


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
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
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
                  variant="outlined"
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
                  variant="outlined"
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
                  variant="outlined"
                  sx={textFieldStyles}
                />
              </Box>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
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
                  variant="outlined"
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
                  variant="outlined"
                  sx={textFieldStyles}
                />
              </Box>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr' }, 
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
                  variant="outlined"
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
                      checked={formData.userEnabled}
                      onChange={() => handleToggleChange('userEnabled')}
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
                sx={{ mt: 3 }}
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

export default AddUser;
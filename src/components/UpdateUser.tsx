import { updateUser, getUser, deleteUser } from '../services/api';
import React, { useState, useEffect, useCallback } from 'react';

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
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

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
  isEnabled?: boolean;
  fingerprintEnabled?: boolean;
}

interface UpdateUserProps {
  userId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  isProfileEdit?: boolean; // New prop to indicate if this is profile editing
}

const UpdateUser: React.FC<UpdateUserProps> = ({ userId, onSuccess, onCancel, isProfileEdit = false }) => {
  const user = useAuth();
  const theme = useTheme();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: '',
    userType: 2,
    isEnabled: true,
    fingerprintEnabled: false
  });

  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is trying to delete themselves
  const isCurrentUser = userId === user?.user?.userID; // Simplified since we removed currentUser context

  const textFieldStyles = {
    '& .MuiFilledInput-root': {
      backgroundColor: theme.palette.background.default,
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
        backgroundColor: theme.palette.action.hover,
      },
      '&.Mui-focused': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1px',
        backgroundColor: theme.palette.action.hover,
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
    '& .MuiFilledInput-input': {
      backgroundColor: 'transparent',
    },
    '& .MuiInputBase-input': {
      backgroundColor: 'transparent',
    },
  };

  const loadUser = useCallback(async () => {
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
        isEnabled: user.isEnabled ?? true,
        fingerprintEnabled: user.fingerprintEnabled ?? false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        (name === 'userType') ? Number(value) : value
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
        isEnabled: formData.isEnabled,
        fingerprintEnabled: formData.fingerprintEnabled
      };

      if (changePassword) {
        updateData.password = formData.password;
      }

      await updateUser(userId, updateData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!originalUser) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${originalUser.userName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      await deleteUser(originalUser.userID, 0);

      // Call onSuccess to close the dialog and refresh the list
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
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
      <Box sx={{
        padding: { xs: 0, sm: 0 },
        maxWidth: { xs: '100%', sm: 600 },
        margin: '0 auto'
      }}>
        <Card sx={{
          boxShadow: { xs: 0, sm: 2 },
          borderColor: { xs: 'transparent', sm: theme.palette.divider },
          backgroundColor: { xs: 'transparent', sm: theme.palette.background.paper },
          padding: { xs: 0, sm: 2 }
        }}>
          <CardContent sx={{ p: { xs: 0, sm: 3 } }}>
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

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
                mb: 2,
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

              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNo"
                type="tel"
                value={formData.phoneNo}
                onChange={handleInputChange}
                variant="filled"
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
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                  mb: 2
                }}>
                  <TextField
                    fullWidth
                    label="New Password"
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
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    variant="filled"
                    sx={textFieldStyles}
                  />
                </Box>
              )}

              <TextField
                fullWidth
                select
                label="User Type"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                variant="filled"
                sx={{ mb: 2, ...textFieldStyles }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value={1}>Admin</option>
                <option value={2}>User</option>
              </TextField>


              {/* Only show toggles if not in profile edit mode */}
              {!isProfileEdit && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  gap: 2
                }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isEnabled}
                        onChange={() => handleToggleChange('isEnabled')}
                        color="primary"
                      />
                    }
                    label="User Enabled"
                    sx={{ margin: 0 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.fingerprintEnabled}
                        onChange={() => handleToggleChange('fingerprintEnabled')}
                        color="primary"
                      />
                    }
                    label="Fingerprint Enabled"
                    sx={{ margin: 0 }}
                  />
                </Box>
              )}

              <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3, mb: 3 }}>
                {!isCurrentUser && !isProfileEdit && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{
                      backgroundColor: '#d32f2f',
                      '&:hover': {
                        backgroundColor: '#b71c1c',
                      }
                    }}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
                <Stack direction="row" spacing={2} sx={{ ml: isCurrentUser ? 0 : 'auto' }}>
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
                    {loading ? 'Updating...' : 'Update'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>

    </>
  );
};

export default UpdateUser;
import React, { useState } from 'react';
import { createUser } from '../services/api';
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
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FilledInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

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
    isEnabled: true,
    fingerprintEnabled: false,
    selectedBoxes: [] as number[]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const multiSelectStyles = {
    // Let the theme handle the styling, just ensure consistent appearance
    '& .MuiFilledInput-root': {
      borderRadius: '8px 8px 8px 8px', // Add bottom border radius
      '&:before': {
        borderBottom: 'none',
      },
      '&:after': {
        borderBottom: 'none',
      },
      '&:hover:not(.Mui-disabled):before': {
        borderBottom: 'none',
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
  };

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

  const handleBoxSelectionChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      selectedBoxes: typeof value === 'string' ? value.split(',').map(Number) : value
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
        isEnabled: formData.isEnabled,
        fingerprintEnabled: formData.fingerprintEnabled,
        boxIDs: formData.selectedBoxes.length > 0 ? formData.selectedBoxes : undefined
      });

      onSuccess?.(userID);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };


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

              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth variant="filled" sx={multiSelectStyles}>
                  <InputLabel id="box-selection-label">Select Boxes (Optional)</InputLabel>
                  <Select
                    labelId="box-selection-label"
                    multiple
                    value={formData.selectedBoxes}
                    onChange={handleBoxSelectionChange}
                    input={<FilledInput />}
                    renderValue={(selected) => (
                      <Box sx={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 0.5, 
                        minHeight: '20px',
                        alignItems: 'center',
                        paddingTop: selected.length > 0 ? '8px' : '0' // Add padding when items are selected
                      }}>
                        {selected.map((value) => {
                          const box = boxList.find(b => b.boxID === value);
                          return (
                            <Chip 
                              key={value} 
                              label={box ? box.description : `Box ${value}`}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {boxList.map((box) => (
                      <MenuItem key={box.boxID} value={box.boxID}>
                        <Checkbox
                          checked={formData.selectedBoxes.indexOf(box.boxID) > -1}
                        />
                        <ListItemText primary={box.description} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>


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

    </>
  );
};

export default AddUser;
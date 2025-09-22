import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import UpdateUser from '../components/UpdateUser';

export default function Profile() {
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const getUserTypeLabel = (userType: number) => {
    switch (userType) {
      case 1: return 'Administrator';
      case 2: return 'User';
      case 3: return 'Viewer';
      default: return 'Unknown';
    }
  };

  const getUserTypeColor = (userType: number) => {
    switch (userType) {
      case 1: return 'error'; // Red for admin
      case 2: return 'primary'; // Blue for user
      case 3: return 'success'; // Green for viewer
      default: return 'default';
    }
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    // The user data will be updated automatically through the auth context
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Profile
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEditClick}
          sx={{ minWidth: 120 }}
        >
          Edit Profile
        </Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* User ID and Type */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" component="h2">
                  User Information
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body1" color="text.secondary">
                  User ID: {user.userID}
                </Typography>
                <Chip
                  label={getUserTypeLabel(user.userType)}
                  color={getUserTypeColor(user.userType)}
                  size="small"
                  icon={<AdminIcon />}
                />
              </Stack>
            </Box>

            <Divider />

            {/* Username */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user.userName}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Email */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EmailIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Phone Number */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PhoneIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user.phoneNo || 'Not provided'}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Account Status */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" component="h2">
                  Account Status
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label="Active"
                  color="success"
                  size="small"
                />
                {user.fingerprintEnabled === true && (
                  <Chip
                    label="Fingerprint Enabled"
                    color="success"
                    size="small"
                    icon={<FingerprintIcon />}
                  />
                )}
              </Stack>
            </Box>

          </Stack>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle>
          Edit Profile
        </DialogTitle>
        <DialogContent>
          <UpdateUser
            userId={user.userID}
            onSuccess={handleEditSuccess}
            onCancel={handleEditClose}
            isProfileEdit={true}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
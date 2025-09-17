import React, { useState, useEffect } from 'react';
// import AddUser from './AddUser';
// import UpdateUser from './UpdateUser';
import { getUsers } from '../services/api';
import {
  Box,
  // Card,
  // CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Stack,
  // TextField,
  // Switch,
  // FormControlLabel,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';

const UserList: React.FC<{ onAddUser: () => void; onEditUser: (user: User) => void; refreshTrigger?: number }> = ({ onAddUser, onEditUser, refreshTrigger }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const getUserTypeLabel = (userType: number) => userType === 1 ? 'Admin' : 'User';

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your authorized users.
        </Typography>
      </Stack>
      <Box>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddUser}
            >
              Add User
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : (

          <TableContainer component={Paper} sx={{ border: 1, borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow >
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fingerprint</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.userID}
                    sx={{
                      backgroundColor: index % 2 === 0 ? 'white' : 'grey.50',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell>{user.userName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNo || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getUserTypeLabel(user.userType)}
                        color={user.userType === 1 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.userEnabled ? 'Active' : 'Inactive'}
                        color={user.userEnabled ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={user.fingerprintEnabled ? 'Enabled' : 'Disabled'}
                          color={user.fingerprintEnabled ? 'success' : 'default'}
                          size="small"
                        />
                        {user.fingerprintNum && (
                          <Chip
                            label="Registered"
                            color="info"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        onClick={() => onEditUser(user)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>

  );
};

export default UserList;
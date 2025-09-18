import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Container,
  Tooltip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import UsersGrid, { UsersGridRef } from './UsersGrid';

const UserList: React.FC<{ onAddUser: () => void; onEditUser: (user: User) => void; refreshTrigger?: number }> = ({ onAddUser, onEditUser, refreshTrigger }) => {
  const gridRef = useRef<UsersGridRef>(null);

  const handleRefresh = () => {
    if (gridRef.current) {
      gridRef.current.refresh();
    }
  };

  return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your authorized users.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                color="primary"
                sx={{
                  width: { xs: 40},
                  height: { xs: 40}
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddUser}
            >
              Add User
            </Button>
          </Stack>
        </Box>

        <UsersGrid ref={gridRef} onEditUser={onEditUser} />
      </Box>
  );
};

export default UserList;
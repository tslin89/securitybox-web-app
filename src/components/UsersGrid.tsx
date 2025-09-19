import * as React from 'react';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from '@mui/x-data-grid';
import { Edit as EditIcon } from '@mui/icons-material';

import { getUsers } from '../services/api';

export interface UsersGridRef {
  refresh: () => void;
}

// --- Helpers ---
function getUserTypeLabel(userType: number) {
  return userType === 1 ? 'Admin' : 'User';
}

function getStatusLabel(enabled: boolean) {
  return enabled ? 'Active' : 'Inactive';
}

function getFingerprintStatus(user: User) {
  if (user.fingerprintEnabled && user.fingerprintNum) {
    return 'Registered';
  } else if (user.fingerprintEnabled) {
    return 'Enabled';
  } else {
    return 'Disabled';
  }
}

const UsersGrid = forwardRef<UsersGridRef, { onEditUser: (user: User) => void }>(({ onEditUser }, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  useImperativeHandle(ref, () => ({
    refresh: fetchUsers
  }), []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'actions',
      headerName: '-',
      width: 60,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton
          onClick={() => onEditUser(params.row)}
          color="primary"
          size="small"
        >
          <EditIcon />
        </IconButton>
      ),
    },
    {
      field: 'userID',
      headerName: 'ID',
      width: 80,
      type: 'number',
    },
    {
      field: 'userName',
      headerName: 'Name',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'phoneNo',
      headerName: 'Phone',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'userType',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={getUserTypeLabel(params.value)}
          color={params.value === 1 ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'isEnabled',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'fingerprint',
      headerName: 'Fingerprint',
      width: 120,
      renderCell: (params) => {
        const status = getFingerprintStatus(params.row);
        return (
          <Chip
            label={status}
            color={status === 'Registered' ? 'info' : status === 'Enabled' ? 'success' : 'default'}
            size="small"
          />
        );
      },
    },
    
  ], [onEditUser]);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Transform users data to include id property for DataGrid
  const rowsWithId = users.map(user => ({
    ...user,
    id: user.userID, // Map userID to id for DataGrid
  }));

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rowsWithId}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
          sorting: {
            sortModel: [{ field: 'userID', sort: 'desc' }],
          },
        }}
        slots={{
          toolbar: GridToolbar,
        }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'grey.50',
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
          
        }}
      />
    </Box>
  );
});

UsersGrid.displayName = 'UsersGrid';

export default UsersGrid;

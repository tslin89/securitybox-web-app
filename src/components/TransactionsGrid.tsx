import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
} from '@mui/x-data-grid';

import { getTransactions } from '../services/api';
import { useSignalR } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';

// --- Types that match your API ---
export type TxRow = {
  id: number;
  timeStamp: string;  // ISO string
  boxID: number;
  eventCode: string;
  doorState: number;
  fingerprintNum: number;
  totalWeight: number;
  boxPosition: number;
};

type ApiResponse = {
  transactionID: string;
  status: number;
  message: string;
  data?: {
    transactions: TxRow[];
    totalCount: number;
    page: number;       // 0-based (matches your current API)
    pageSize: number;
    totalPages: number;
  };
};

// --- Helpers ---
function eventLabel(code: string) {
  switch (code) {
    case 'C000': return 'Wifi connected';
    case 'C001': return 'Box opened';
    case 'C002': return 'Box closed';
    case 'C003': return 'Parcel delivered';
    case 'C004': return 'Parcel retrieved';
    case 'C005': return 'Security deactivated';
    case 'C006': return 'Security reactivated';
    case 'C007': return 'Parcel stolen';
    case 'C008': return 'Parcel returned';
    case 'C009': return 'Box stolen';
    case 'C010': return 'Box returned';
    case 'D001': return 'Fingerprint Registered'
    default:     return 'Unknown';
  }
}

export default function TransactionsGrid() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { onTransactionUpdate, offTransactionUpdate } = useSignalR();
  const { user } = useAuth() as any; // adjust typing to your AuthContext

  // grid state
  const [rows, setRows] = useState<TxRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  // columns
  const columns = useMemo<GridColDef<TxRow>[]>(
    () => [
      { field: 'id', headerName: 'ID', minWidth: 90, flex: 0.3 },
      {
        field: 'timeStamp',
        headerName: 'Timestamp',
        minWidth: 170,
        flex: 0.9,
        type: 'dateTime',
        //valueGetter: (row) => (row.value ? new Date(row.value as string) : null),
        valueFormatter: (value) => (value ? (value as Date).toLocaleString() : ''),
      },
      { field: 'boxID', headerName: 'Box ID', minWidth: 110, flex: 0.5 },
      {
        field: 'eventCode',
        headerName: 'Event',
        minWidth: 200,
        flex: 1.2,
        renderCell: (params) => (
          <Chip
            label={`${params.value}: ${eventLabel(params.value as string)}`}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: 'doorState',
        headerName: 'Door',
        minWidth: 120,
        flex: 0.6,
        renderCell: (params) => {
          const open = Number(params.value) !== 0;
          return (
            <Chip
              size="small"
              label={open ? 'Open' : 'Closed'}
              color={open ? 'error' : 'success'}
              variant="outlined"
            />
          );
        },
      },
      { field: 'fingerprintNum', headerName: 'Fingerprint', minWidth: 120, flex: 0.6 },
      {
        field: 'totalWeight',
        headerName: 'Weight (g)',
        type: 'number',
        minWidth: 130,
        flex: 0.6,
        valueFormatter: (value) => value != null ? Number(value as number).toLocaleString() : '',
      },
      { field: 'boxPosition', headerName: 'Position', minWidth: 120, flex: 0.6 },
    ],
    []
  );

  const columnVisibilityModel = useMemo(
    () => ({
      fingerprintNum: !isXs,
      totalWeight: !isXs,
      boxPosition: !isXs,
    }),
    [isXs]
  );

  // fetch current page from your existing API
  async function fetchPage() {
    if (!user?.userID && user?.userID !== 0) return;
    setLoading(true);
    try {
      const res = (await getTransactions(
        String(user.userID),              // ✅ your API needs userId as string
        paginationModel.page,         // your API is already 0-based
        paginationModel.pageSize
      )) as ApiResponse;

      if (res.status === 1 && res.data) {
        setRows(res.data.transactions ?? []);
        setRowCount(res.data.totalCount ?? 0);

        // sync back if backend adjusts page/pageSize
        if (
          res.data.page !== paginationModel.page ||
          res.data.pageSize !== paginationModel.pageSize
        ) {
          setPaginationModel({ page: res.data.page, pageSize: res.data.pageSize });
        }
      } else {
        setRows([]);
        setRowCount(0);
      }
    } finally {
      setLoading(false);
    }
  }

  // load on page/pageSize/user change
  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, user?.userID]);

  // refresh on SignalR events
  useEffect(() => {
    const handler = () => fetchPage();
    onTransactionUpdate(handler);
    return () => offTransactionUpdate(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    
      <Box sx={{ width: '100%' }}>
        <DataGrid<TxRow>
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          autoHeight
          // pagination (server)
          rowCount={rowCount}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          // client-side sorting on the current page (your API doesn’t take sort yet)
          sortingMode="client"
          // no server filter/search since your API doesn’t support it yet
          filterMode="client"
          columnVisibilityModel={columnVisibilityModel}
          // toolbar: quick filter will only filter the current page (client mode)
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } },
          }}
          sx={{
            '& .MuiDataGrid-cell': { outline: 'none' },
            '& .MuiDataGrid-virtualScroller': { overscrollBehavior: 'contain' },
          }}
        />
      </Box>
  );
}

import * as React from 'react';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
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
import { formatDateTime } from '../utils/dateFormatter';

// --- Types that match your API ---
export type TxRow = {
  id: number;
  timeStamp: string;  // ISO string
  boxID: number;
  eventCode: string;
  eventDescription: string;
  eventType: number;  // 0=info, 1=warning, 2=success, 3=error
  doorState: number;
  fingerprintNum: number;
  totalWeight: number;
  boxPosition: number;
  securityStatus: number;
};

export interface TransactionsGridRef {
  refresh: () => void;
}

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
function getEventTypeColor(eventType: number): 'default' | 'warning' | 'success' | 'error' {
  switch (eventType) {
    case 0: return 'default';   // info
    case 1: return 'warning';   // warning
    case 2: return 'success';   // success
    case 3: return 'error';     // error
    default: return 'default';
  }
}

function getEventDescription(eventCode: string, eventCodes: any[]): string {
  const event = eventCodes.find(e => e.eventCode === eventCode);
  return event ? event.eventDescription : 'Unknown Event';
}

const TransactionsGrid = forwardRef<TransactionsGridRef>((props, ref) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const { onTransactionUpdate, offTransactionUpdate } = useSignalR();
  const { user, eventCodes } = useAuth() as any; // adjust typing to your AuthContext

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
        valueFormatter: (value) => formatDateTime(value),
      },
      { field: 'boxID', headerName: 'Box ID', minWidth: 110, flex: 0.5 },
      {
        field: 'eventDescription',
        headerName: 'Event Description',
        minWidth: 200,
        flex: 1.5,
        renderCell: (params) => {
          const eventCode = params.row.eventCode;
          const eventDescription = getEventDescription(eventCode, eventCodes);
          const eventType = params.row.eventType;
          return (
            <Chip
              label={`${eventCode} - ${eventDescription}`}
              size="small"
              variant="outlined"
              color={getEventTypeColor(eventType)}
            />
          );
        },
      },
      {
        field: 'doorState',
        headerName: 'Door',
        minWidth: 120,
        flex: 0.6,
        renderCell: (params) => {
          const open = Number(params.value) === 1;
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
      {
        field: 'boxPosition',
        headerName: 'Position',
        minWidth: 120,
        flex: 0.6,
        renderCell: (params) => {
          const stolen = Number(params.value) === 1;
          return (
            <Chip
              size="small"
              label={stolen ? 'Stolen' : 'In place'}
              color={stolen ? 'error' : 'success'}
              variant="outlined"
            />
          );
        },
      },
      {
        field: 'securityStatus',
        headerName: 'Security',
        minWidth: 120,
        flex: 0.6,
        renderCell: (params) => {
          const open = Number(params.value) === 1;
          return (
            <Chip
              size="small"
              label={open ? 'Enabled' : 'Disabled'}
              color={open ? 'success' : 'error'}
              variant="outlined"
            />
          );
        },
      },
      { field: 'fingerprintNum', headerName: 'Fingerprint ID', minWidth: 100, flex: 0.6, type: 'number' },
      {
        field: 'totalWeight',
        headerName: 'Weight (g)',
        type: 'number',
        minWidth: 130,
        flex: 0.6,
        valueFormatter: (value) => value != null ? Number(value as number).toLocaleString() : '',
      },

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

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchPage
  }), [user?.userID, paginationModel.page, paginationModel.pageSize]);

  // load on page/pageSize/user change
  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, user?.userID]);

  // refresh on SignalR events
  // useEffect(() => {
  //   const handler = () => fetchPage();
  //   onTransactionUpdate(handler);
  //   return () => offTransactionUpdate(handler);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <Box sx={{
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      borderRadius: 1,
      overflow: 'hidden'
    }}>
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
        // client-side sorting on the current page (your API doesn't take sort yet)
        sortingMode="client"
        // no server filter/search since your API doesn't support it yet
        filterMode="client"
        columnVisibilityModel={columnVisibilityModel}
        // toolbar: quick filter will only filter the current page (client mode)
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } },
        }}
        sx={{
          backgroundColor: theme.palette.background.paper,
          '& .MuiDataGrid-root': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-main': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-container--top': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-container--bottom': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-cell': {
            outline: 'none',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-row': {
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.action.selected,
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
              },
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.background.paper,
            borderBottom: `2px solid ${theme.palette.divider}`,
            fontWeight: 600,
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-toolbarContainer': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-virtualScroller': {
            overscrollBehavior: 'contain',
            backgroundColor: theme.palette.background.paper,
          },
        }}
      />
    </Box>
  );
});

TransactionsGrid.displayName = 'TransactionsGrid';

export default TransactionsGrid;

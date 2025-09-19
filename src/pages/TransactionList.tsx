// src/pages/TransactionList.tsx
import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
// import Breadcrumbs from '@mui/material/Breadcrumbs';
// import Link from '@mui/material/Link';
// import { Link as RouterLink } from 'react-router-dom';
import TransactionsGrid, { TransactionsGridRef } from '../components/TransactionsGrid';

export default function TransactionList() {
  const gridRef = React.useRef<TransactionsGridRef>(null);

  const handleRefresh = () => {
    if (gridRef.current) {
      gridRef.current.refresh();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 }  }}>
      <Stack spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Transaction List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and search your recent parcel transactions.
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              color="primary"
              sx={{
                width: { xs: 40 },
                height: { xs: 40 }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
      <TransactionsGrid ref={gridRef} />
    </Container>
  );
}

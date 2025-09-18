// src/pages/TransactionList.tsx
import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
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
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ minWidth: 120 }}
          >
            Refresh
          </Button>
        </Box>
      </Stack>
      <TransactionsGrid ref={gridRef} />
    </Container>
  );
}

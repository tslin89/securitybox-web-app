// src/pages/TransactionList.tsx
import * as React from 'react';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';
import TransactionsGrid from '../components/TransactionsGrid';

export default function TransactionList() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} sx={{ mb: 1 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} underline="hover" color="inherit" to="/dashboard">
            Home
          </Link>
          <Typography color="text.primary">Transaction List</Typography>
        </Breadcrumbs>

        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Transaction List
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and search your recent parcel transactions.
        </Typography>
      </Stack>

      <TransactionsGrid />
    </Container>
  );
}

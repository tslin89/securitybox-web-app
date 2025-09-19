// src/pages/Dashboard.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
// import Header from '../components/Header';
import MainGrid from '../components/MainGrid';
import Container from '@mui/material/Container';

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 }  }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        {/* <Header /> */}
        <MainGrid />
      </Stack>
    </Container>
  );
}


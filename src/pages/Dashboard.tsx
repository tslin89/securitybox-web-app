// src/pages/Dashboard.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
// import Header from '../components/Header';
import MainGrid from '../components/MainGrid';

export default function Dashboard() {
  return (
    <Box sx={{ px: 3, pb: 5, mt: { xs: 7, md: 0 } }}>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        {/* <Header /> */}
        <MainGrid />
      </Stack>
    </Box>
  );
}

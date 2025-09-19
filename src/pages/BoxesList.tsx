import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Button,
  useTheme,
} from "@mui/material";
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { BoxData, getLastEventData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BoxCard from '../components/BoxCard';

export default function BoxesList() {
  const theme = useTheme();
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBoxes = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      const response = await getLastEventData(user.userID, 0); // Get all boxes
      if (response.status === 1 && response.data) {
        setBoxes(response.data);
      } else {
        setError(response.message || 'Failed to fetch boxes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshBox = useCallback(async (boxId: number) => {
    if (!user) return;
    
    try {
      const response = await getLastEventData(user.userID, boxId);
      if (response.status === 1 && response.data && response.data.length > 0) {
        const updatedBox = response.data[0];
        setBoxes(prevBoxes => 
          prevBoxes.map(box => 
            box.boxID === boxId ? updatedBox : box
          )
        );
      }
    } catch (err) {
      console.error('Failed to refresh box:', err);
    }
  }, [user]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await fetchBoxes();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBoxes();
  }, [fetchBoxes]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchBoxes}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 } }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Security Boxes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage your IoT Enabled Security Boxes.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefreshAll}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'All'}
          </Button>
        </Box>
      </Stack>

      {boxes.length === 0 ? (
        <Alert severity="info">
          No security boxes found. Please check your device configuration.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {boxes.map((box) => (
            <BoxCard key={box.boxID} box={box} onRefresh={refreshBox} />
          ))}
        </Box>
      )}
    </Container>
  );
}
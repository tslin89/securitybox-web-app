import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Button,
  Chip,
} from "@mui/material";
import { Refresh as RefreshIcon, Wifi as WifiIcon } from '@mui/icons-material';
import { BoxData, getUserBoxData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSignalR } from '../contexts/SignalRContext';
import BoxCard from '../components/BoxCard';

export default function BoxesList() {
  const { user } = useAuth();
  const { onTransactionUpdate, offTransactionUpdate } = useSignalR();
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const fetchBoxes = useCallback(async () => {
    if (!user) return;
    
    try {
      setError(null);
      const response = await getUserBoxData(user.userID, 0); // Get all boxes
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
      const response = await getUserBoxData(user.userID, boxId);
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
    console.log('🔄 Manual refresh triggered');
    await fetchBoxes();
    setRefreshing(false);
  };

  // Test function to manually trigger SignalR callback
  const testSignalRCallback = () => {
    console.log('🧪 Testing SignalR callback manually...');
    fetchBoxes();
  };

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);
      console.log(`👁️ Page visibility changed: ${isVisible ? 'visible' : 'hidden'}`);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // SignalR real-time updates
  useEffect(() => {
    console.log('🔌 Setting up SignalR transaction update listener...');
    
    const handleSignalRUpdate = (eventType: string) => {
      // Only refresh if page is visible
      if (isPageVisible) {
        console.log(`🔄 SignalR ${eventType} received, refreshing boxes...`);
        fetchBoxes();
      } else {
        console.log(`🔄 SignalR ${eventType} received but page is not visible, skipping refresh`);
      }
    };

    // Listen for transaction updates
    const handleTransactionUpdate = () => {
      console.log('🔄 SignalR transaction update callback triggered in BoxesList');
      handleSignalRUpdate('transaction update');
    };
    
    console.log('🔌 Registering transaction update callback...');
    onTransactionUpdate(handleTransactionUpdate);
    
    return () => {
      console.log('🔌 Unregistering transaction update callback...');
      offTransactionUpdate(handleTransactionUpdate);
    };
  }, [onTransactionUpdate, offTransactionUpdate, fetchBoxes, isPageVisible]);

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Box Status & Security Control
              </Typography>
              {isPageVisible && (
                <Chip
                  icon={<WifiIcon />}
                  label="Live Updates"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage your IoT Enabled Security Boxes.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={handleRefreshAll}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh All'}
            </Button>
            
          </Box>
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
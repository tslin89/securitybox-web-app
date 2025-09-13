import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/api';
import { useSignalR } from '../contexts/SignalRContext';
import PaginatedTransactionTable from '../components/PaginatedTransactionTable';

// Define the transaction type based on your API response
interface Transaction {
  id: number;
  timeStamp: string;
  boxID: number;
  eventCode: string;
  doorState: number;
  fingerprintNum: number;
  totalWeight: number;
  boxPosition: number;
}

interface ApiResponse {
  transactionID: string;
  status: number;
  message: string;
  data: Transaction[];
}

const Dashboard: React.FC = () => {
  const { onTransactionUpdate, offTransactionUpdate, stopConnection } = useSignalR();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      // Stop SignalR connection
      await stopConnection();

      // Logout from auth context (this clears localStorage)
      logout();

      // Navigate back to login
      window.location.href = '/';

    } catch (error) {
      console.error('Error during logout:', error);
      // Navigate anyway
      window.location.href = '/';
    }
  };

  const fetchTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const response: ApiResponse = await getTransactions('', 0, 0);
      
      if (response.status === 1 && response.data) {
        setTransactions(response.data);
      } else {
        setError('Failed to load transactions');
      }
    } catch (err) {
      setError('Error fetching transactions: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    
    // Register for real-time updates
    onTransactionUpdate(fetchTransactions);
    
    // Cleanup
    return () => {
      offTransactionUpdate(fetchTransactions);
    };
  }, [fetchTransactions, onTransactionUpdate, offTransactionUpdate]);

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getDoorStateText = (state: number): string => {
    return state === 0 ? 'Closed' : 'Open';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow dashboard-header-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Winter Security Box System</h1>
              <h3 className="text-xl font-semibold text-gray-900">
                Welcome, {user?.name || 'Unknown User'}
              </h3>
            </div>
            <div className="flex items-center space-x-4">
              {/* <button
                onClick={fetchTransactions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh
              </button> */}
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PaginatedTransactionTable />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
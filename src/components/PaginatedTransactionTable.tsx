import React, { useState, useEffect, useCallback } from 'react';
import { getTransactions } from '../services/api';
import { useSignalR } from '../contexts/SignalRContext';


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

interface PaginatedApiResponse {
    transactionID: string;
    status: number;
    message: string;
    data: {
        transactions: Transaction[];
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

const PaginatedTransactionTable: React.FC = () => {
    const { onTransactionUpdate, offTransactionUpdate } = useSignalR();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(25);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    const didInit = React.useRef(false);

    const fetchTransactions = useCallback(async (
        page: number = currentPage,
        size: number = pageSize
    ): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            // Update API call to include pagination
            const response: PaginatedApiResponse = await getTransactions('', page, size);

            if (response.status === 1 && response.data) {
                setTransactions(response.data.transactions);
                setTotalCount(response.data.totalCount);
                setTotalPages(response.data.totalPages);
                setCurrentPage(response.data.page);
            } else {
                setError('Failed to load transactions');
            }
        } catch (err) {
            setError('Error fetching transactions: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize]);

    // Handle page changes
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchTransactions(newPage, pageSize);
    };

    // Handle page size changes
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(0); // Reset to first page
        fetchTransactions(0, newSize);
    };

    // SignalR update handler - refresh current page
    const handleSignalRUpdate = useCallback(() => {
        console.log('📊 Refreshing transactions due to SignalR update');
        fetchTransactions(currentPage, pageSize);
    }, [fetchTransactions, currentPage, pageSize]);

    useEffect(() => {

        if (didInit.current) return;     // prevent StrictMode second mount call
        didInit.current = true;

        fetchTransactions();

        // Register for real-time updates
        onTransactionUpdate(handleSignalRUpdate);

        return () => {
            offTransactionUpdate(handleSignalRUpdate);
        };
    });

    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getDoorStateText = (state: number): string => {
        return state === 0 ? 'Closed' : 'Open';
    };

    // Generate page numbers for pagination
    const getPageNumbers = (): number[] => {
        const maxVisible = 5;
        const start = Math.max(0, Math.min(currentPage - 2, totalPages - maxVisible));
        const end = Math.min(totalPages, start + maxVisible);
        return Array.from({ length: end - start }, (_, i) => start + i);
    };

    const formatEventCode = (code: string) => {
        let desc = "Unknown";
        switch (code) {
            case "C000": desc = "Wifi connected"; break;
            case "C001": desc = "Box opened"; break;
            case "C002": desc = "Box closed"; break;
            case "C003": desc = "Parcel delivered"; break;
            case "C004": desc = "Parcel retrieved"; break;
            case "C005": desc = "Security deactivated"; break;
            case "C006": desc = "Security reactivated"; break;
            case "C007": desc = "Parcel stolen"; break;
            case "C008": desc = "Parcel returned"; break;
            case "C009": desc = "Box stolen"; break;
            case "C010": desc = "Box returned"; break;
        }
        return `${code}: ${desc}`;
    }

    return (
        <div style={{}}>
            <div style={{ margin: '0 auto', padding: '5px' }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '24px'
                }}>
                    <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
                                    Recent Transactions
                                </h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', margin: 0 }}>
                                    Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} transactions
                                </p>
                            </div>

                            {/* Page Size Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', color: '#374151' }}>Show:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    style={{
                                        padding: '4px 8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>

                                <button
                                    onClick={() => fetchTransactions()}
                                    style={{
                                        marginLeft: '12px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '32px' }}>
                            <div style={{
                                display: 'inline-block',
                                width: '32px',
                                height: '32px',
                                border: '3px solid #f3f3f3',
                                borderTop: '3px solid #3498db',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></div>
                            <p style={{ marginTop: '8px', color: '#6b7280' }}>Loading transactions...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ color: '#ef4444' }}>{error}</p>
                            <button
                                onClick={() => fetchTransactions()}
                                style={{
                                    marginTop: '8px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Timestamp</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Box ID</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Event Code</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Door State</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Fingerprint</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Weight (g)</th>
                                            <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#374151', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>Position</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ backgroundColor: 'white' }}>
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                                    {transaction.id}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                                                    {formatDateTime(transaction.timeStamp)}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                                                    {transaction.boxID}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        padding: '2px 8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        borderRadius: '9999px',
                                                        // backgroundColor: '#dbeafe',
                                                        // color: '#1e40af'
                                                    }}>
                                                        {formatEventCode(transaction.eventCode)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        padding: '2px 8px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        borderRadius: '9999px',
                                                        backgroundColor: transaction.doorState === 0 ? '#dcfce7' : '#fee2e2',
                                                        color: transaction.doorState === 0 ? '#166534' : '#991b1b'
                                                    }}>
                                                        {getDoorStateText(transaction.doorState)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                                                    {transaction.fingerprintNum}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                                                    {transaction.totalWeight}
                                                </td>
                                                <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                                                    {transaction.boxPosition}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'between',
                                    alignItems: 'center',
                                    padding: '16px 24px',
                                    borderTop: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#374151', marginRight: 20 }}>
                                        Page {currentPage + 1} of {totalPages}
                                    </div>

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0}
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor: currentPage === 0 ? '#f9fafb' : 'white',
                                                color: currentPage === 0 ? '#9ca3af' : '#374151',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Previous
                                        </button>

                                        {/* Page Numbers */}
                                        {getPageNumbers().map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                style={{
                                                    padding: '8px 12px',
                                                    border: '1px solid #d1d5db',
                                                    backgroundColor: pageNum === currentPage ? '#3b82f6' : 'white',
                                                    color: pageNum === currentPage ? 'white' : '#374151',
                                                    borderRadius: '6px',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    minWidth: '40px'
                                                }}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        ))}

                                        {/* Next Button */}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= totalPages - 1}
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor: currentPage >= totalPages - 1 ? '#f9fafb' : 'white',
                                                color: currentPage >= totalPages - 1 ? '#9ca3af' : '#374151',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {transactions.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '32px' }}>
                                    <p style={{ color: '#6b7280' }}>No transactions found</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default PaginatedTransactionTable;
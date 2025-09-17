// components/GlobalAlerts.tsx (with manual reconnect button)
import React from 'react';
import { useSignalR } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../alerts/AlertsProvider';

const GlobalAlerts: React.FC = () => {
  const { isConnected, connectionState, forceReconnect } = useSignalR();
  const { alerts, dismiss } = useAlerts();
  const { isAuthenticated } = useAuth();

  // Debug logging
  console.log('🔍 GlobalAlerts - isConnected:', isConnected, 'connectionState:', connectionState);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getAlertStyles = (severity: string) => {
    const baseStyle = {
      border: '1px solid',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s ease',
      marginBottom: '8px',
      maxWidth: '384px'
    };

    switch (severity) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          color: '#166534'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fffbeb',
          borderColor: '#fde68a',
          color: '#92400e'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          color: '#991b1b'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#eff6ff',
          borderColor: '#bfdbfe',
          color: '#1e40af'
        };
    }
  };

  const connectionStatusStyle = {
    position: 'fixed' as const,
    top: '50px',
    right: '22px',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
    color: isConnected ? '#166534' : '#991b1b',
    border: '1px solid',
    borderColor: isConnected ? '#bbf7d0' : '#fecaca',
    cursor: !isConnected ? 'pointer' : 'default'
  };

  const alertContainerStyle = {
    position: 'fixed' as const,
    top: isAuthenticated ? '80px' : '16px',
    right: '22px',
    zIndex: 50,
    maxWidth: '384px'
  };

  const connectionDotStyle = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '8px',
    backgroundColor: isConnected ? '#22c55e' : '#ef4444',
    animation: !isConnected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
  };

  const handleConnectionClick = () => {
    if (!isConnected) {
      console.log('🔄 Manual reconnection triggered by user');
      forceReconnect();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Enhanced Connection Status Indicator */}
      <div 
        style={connectionStatusStyle} 
        onClick={handleConnectionClick}
        title={!isConnected ? "Click to reconnect" : "Connection is active"}
      >
        <div style={connectionDotStyle}></div>
        <div>
          <div>{connectionState}</div>
          {!isConnected && (
            <div style={{ fontSize: '10px', opacity: 0.8 }}>Click to reconnect</div>
          )}
        </div>
      </div>

      {/* Alert Stack */}
      <div style={alertContainerStyle}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={getAlertStyles(alert.severity || 'info')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <span style={{ fontSize: '18px' }}>
                  {getAlertIcon(alert.severity || 'info')}
                </span>
              </div>
              <div style={{ marginLeft: '12px', flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>
                  {alert.message}
                </p>
              </div>
              <div style={{ marginLeft: '12px', flexShrink: 0 }}>
                <button
                  onClick={() => dismiss(alert.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    opacity: 0.7,
                    padding: 0
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </>
  );
};

export default GlobalAlerts;
// contexts/SignalRContext.tsx - Enhanced version
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { initiateSignalR } from '../services/api';

interface AlertData {
    id: string;
    message: string;
    timestamp: Date;
    type: 'info' | 'warning' | 'error' | 'success';
}

interface SignalRContextType {
    connection: HubConnection | null;
    isConnected: boolean;
    connectionState: string;
    alerts: AlertData[];
    clearAlert: (id: string) => void;
    clearAllAlerts: () => void;
    onTransactionUpdate: (callback: () => void) => void;
    offTransactionUpdate: (callback: () => void) => void;
    startConnection: () => Promise<void>;
    stopConnection: () => Promise<void>;
    forceReconnect: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

interface SignalRProviderProps {
    children: ReactNode;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('Disconnected');
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [transactionUpdateCallbacks, setTransactionUpdateCallbacks] = useState<Set<() => void>>(new Set());

    // Refs for tracking reconnection attempts
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = useRef(10);
    const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
    const lastHeartbeat = useRef<Date>(new Date());

    const addAlert = useCallback((message: string, type: AlertData['type'] = 'info') => {
        const newAlert: AlertData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            message,
            timestamp: new Date(),
            type
        };

        console.log(`🚨 Alert: [${type.toUpperCase()}] ${message}`);
        setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);

        if (type !== 'error') {
            setTimeout(() => {
                setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
            }, 5000);
        }
    }, []);

    const clearAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    const clearAllAlerts = useCallback(() => {
        setAlerts([]);
    }, []);

    const onTransactionUpdate = useCallback((callback: () => void) => {
        setTransactionUpdateCallbacks(prev => {
            const newSet = new Set(prev);
            newSet.add(callback);
            return newSet;
        });
    }, []);

    const offTransactionUpdate = useCallback((callback: () => void) => {
        setTransactionUpdateCallbacks(prev => {
            const newSet = new Set(prev);
            newSet.delete(callback);
            return newSet;
        });
    }, []);

    const triggerTransactionUpdate = useCallback(() => {
        transactionUpdateCallbacks.forEach(callback => callback());
    }, [transactionUpdateCallbacks]);

    // Enhanced connection state monitoring
    const updateConnectionState = useCallback((newConnection: HubConnection | null) => {
        if (!newConnection) {
            setConnectionState('Disconnected');
            setIsConnected(false);
            return;
        }

        const state = newConnection.state;
        let stateString = '';

        switch (state) {
            case HubConnectionState.Disconnected:
                stateString = 'Disconnected';
                setIsConnected(false);
                break;
            case HubConnectionState.Connecting:
                stateString = 'Connecting';
                setIsConnected(false);
                break;
            case HubConnectionState.Connected:
                stateString = 'Connected';
                setIsConnected(true);
                reconnectAttempts.current = 0; // Reset on successful connection
                lastHeartbeat.current = new Date();
                break;
            case HubConnectionState.Disconnecting:
                stateString = 'Disconnecting';
                setIsConnected(false);
                break;
            case HubConnectionState.Reconnecting:
                stateString = 'Reconnecting';
                setIsConnected(false);
                break;
        }

        setConnectionState(stateString);
        console.log(`🔌 SignalR State: ${stateString}`);
    }, []);

    // Enhanced connection health monitoring
    const startConnectionHealthCheck = useCallback(() => {
        if (connectionCheckInterval.current) {
            clearInterval(connectionCheckInterval.current);
        }

        connectionCheckInterval.current = setInterval(() => {
            const now = new Date();
            const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.current.getTime();

            // If no heartbeat for 30 seconds and connection thinks it's connected
            if (timeSinceLastHeartbeat > 30000 && connection?.state === HubConnectionState.Connected) {
                console.warn('🚨 Connection appears stale, forcing reconnect...');
                addAlert('Connection appears stale, attempting to reconnect...', 'warning');
                forceReconnect();
            }

            // Log connection status every minute
            if (connection) {
                console.log(`💓 Connection Health Check - State: ${connection.state}, Last Heartbeat: ${timeSinceLastHeartbeat}ms ago`);
            }
        }, 15000); // Check every 15 seconds
    }, [connection, addAlert]);

    const forceReconnect = useCallback(async (): Promise<void> => {
        console.log('🔄 Force reconnecting SignalR...');

        if (connection) {
            try {
                await connection.stop();
            } catch (error) {
                console.error('Error stopping connection during force reconnect:', error);
            }
        }

        // Wait a bit before reconnecting
        setTimeout(async () => {
            try {
                await startConnection();
            } catch (error) {
                console.error('Error during force reconnect:', error);
                addAlert('Force reconnection failed', 'error');
            }
        }, 1000);
    }, [connection, addAlert]);

    const startConnection = useCallback(async (): Promise<void> => {
        if (connection && connection.state === HubConnectionState.Connected) {
            console.log('🔌 SignalR already connected');
            return;
        }

        if (connection && connection.state === HubConnectionState.Connecting) {
            console.log('🔌 SignalR already connecting');
            return;
        }

        try {
            console.log('🚀 Starting SignalR connection...');

            const response = await initiateSignalR();

            if (response.Status === 1 && response.Data) {
                const { Url, AccessToken } = response.Data;

                // Stop existing connection if any
                if (connection) {
                    await connection.stop();
                }

                const newConnection = new HubConnectionBuilder()
                    .withUrl(Url, {
                        accessTokenFactory: () => AccessToken,
                        withCredentials: true
                    })
                    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000]) // More aggressive retry
                    .configureLogging('Information') // Enable detailed logging
                    .build();

                // Enhanced event handlers
                newConnection.on("newAlert", (alertMessage: string) => {
                    console.log("📢 Received alert:", alertMessage);
                    lastHeartbeat.current = new Date(); // Update heartbeat

                    var temp = JSON.parse(alertMessage)
                    let msgType: AlertData['type'] = 'info';
                    let msg = "Unknown";
                    //'info' | 'warning' | 'error' | 'success';

                    switch (temp.EventCode) {
                        case "C005": // security deactivated
                            msg = "Security deactivated";
                            msgType = 'warning';
                            break;
                        case "C008": // parcel returned
                            msg = "Parcel returned";
                            msgType = 'warning';
                            break;
                        case "C010": // box returned
                            msg = "Box returned";
                            msgType = 'warning';
                            break;
                        case "C007": // parcel stolen
                            msg = "Parcel stolen"
                            msgType = "error";
                            break
                        case "C009": // box stolen
                            msg = "Box stolen";
                            msgType = "error";
                            break;
                        case "C003": // parcel delivered
                            msg = "Parcel delivered";
                            msgType = 'success';
                            break;
                        case "C004": // parcel retrieved
                            msg = "Parcel retrieved";
                            msgType = 'success';
                            break;
                        case "C000": // wifi connected
                            msg = "Wifi connected";
                            msgType = 'info';
                            break;
                        case "C001": // box opened
                            msg = "Box opened"
                            msgType = 'info';
                            break;
                        case "C002": // box closed
                            msg = "Box closed";
                            msgType = 'info';
                            break;
                        case "C006": // security reactivated
                            msg = "Security reactivated";
                            msgType = 'info';
                            break
                    }

                    addAlert(msg, msgType);
                });

                newConnection.on("transactionUpdate", (data: any) => {
                    console.log("📊 Transaction update received:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    addAlert("New transaction recorded", 'info');

                    setTimeout(() => {
                        triggerTransactionUpdate();
                    }, 1000);
                });

                newConnection.on("systemAlert", (data: { message: string, type: string }) => {
                    console.log("🎛️ System alert:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    addAlert(data.message, data.type as AlertData['type'] || 'info');
                });

                newConnection.on("deviceStatus", (data: any) => {
                    console.log("📱 Device status update:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    if (data.status === 'offline') {
                        addAlert(`Device ${data.deviceId} is offline`, 'error');
                    } else if (data.status === 'online') {
                        addAlert(`Device ${data.deviceId} is back online`, 'success');
                    }
                });

                // Heartbeat mechanism
                newConnection.on("heartbeat", () => {
                    lastHeartbeat.current = new Date();
                    console.log("💓 Heartbeat received");
                });

                // Enhanced connection state handlers
                newConnection.onreconnecting((error) => {
                    reconnectAttempts.current++;
                    console.warn(`🔄 SignalR reconnecting (attempt ${reconnectAttempts.current})...`, error);
                    updateConnectionState(newConnection);
                    addAlert(`Connection lost, reconnecting... (attempt ${reconnectAttempts.current})`, 'warning');
                });

                newConnection.onreconnected((connectionId) => {
                    console.log(`✅ SignalR reconnected! Connection ID: ${connectionId}`);
                    updateConnectionState(newConnection);
                    addAlert("Connection restored successfully", 'success');
                    lastHeartbeat.current = new Date();
                });

                newConnection.onclose((error) => {
                    console.error('❌ SignalR connection closed:', error);
                    updateConnectionState(newConnection);

                    if (reconnectAttempts.current >= maxReconnectAttempts.current) {
                        addAlert("Connection failed after maximum retry attempts. Please refresh the page.", 'error');
                    } else if (error) {
                        addAlert(`Connection closed: ${error.message}`, 'error');
                        // Attempt manual reconnect after a delay
                        setTimeout(() => {
                            console.log('🔄 Attempting manual reconnect after connection close...');
                            forceReconnect();
                        }, 5000);
                    }
                });

                await newConnection.start();
                console.log('✅ SignalR connection established');

                setConnection(newConnection);
                updateConnectionState(newConnection);
                addAlert("Real-time connection established", 'success');

                // Start health monitoring
                startConnectionHealthCheck();

            } else {
                throw new Error('Failed to get SignalR connection info from API');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
            console.error('❌ SignalR connection failed:', error);
            setConnection(null);
            updateConnectionState(null);
            addAlert(`Connection failed: ${errorMessage}`, 'error');

            // Retry after delay if not too many attempts
            if (reconnectAttempts.current < maxReconnectAttempts.current) {
                setTimeout(() => {
                    console.log(`🔄 Retrying connection in 10 seconds... (attempt ${reconnectAttempts.current + 1})`);
                    startConnection();
                }, 10000);
            }

            throw error;
        }
    }, [connection, addAlert, triggerTransactionUpdate, updateConnectionState, startConnectionHealthCheck, forceReconnect]);

    const stopConnection = useCallback(async (): Promise<void> => {
        if (connectionCheckInterval.current) {
            clearInterval(connectionCheckInterval.current);
            connectionCheckInterval.current = null;
        }

        if (connection) {
            try {
                await connection.stop();
                console.log('🔌 SignalR connection stopped');
                setConnection(null);
                updateConnectionState(null);
                clearAllAlerts();
            } catch (error) {
                console.error('Error stopping SignalR connection:', error);
            }
        }
    }, [connection, updateConnectionState, clearAllAlerts]);

    useEffect(() => {
        return () => {
            if (connectionCheckInterval.current) {
                clearInterval(connectionCheckInterval.current);
            }
            if (connection) {
                console.log('🧹 Cleaning up SignalR connection');
                connection.stop();
            }
        };
    }, [connection]);

    const contextValue: SignalRContextType = {
        connection,
        isConnected,
        connectionState,
        alerts,
        clearAlert,
        clearAllAlerts,
        onTransactionUpdate,
        offTransactionUpdate,
        startConnection,
        stopConnection,
        forceReconnect
    };

    return (
        <SignalRContext.Provider value={contextValue}>
            {children}
        </SignalRContext.Provider>
    );
};

export const useSignalR = (): SignalRContextType => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
};
// contexts/SignalRContext.tsx - Enhanced version
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { initiateSignalR } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../alerts/AlertsProvider';

type Status = 'connected' | 'connecting' | 'disconnected' | 'error';

interface AlertData {
    id: string;
    message: string;
    timestamp: Date;
    type: 'info' | 'warning' | 'error' | 'success';
}

interface SignalRContextType {
    connection: HubConnection | null;
    status: Status;
    lastError?: string;
    isConnected: boolean;
    connectionState: string;
    onTransactionUpdate: (callback: () => void) => void;
    offTransactionUpdate: (callback: () => void) => void;
    startConnection: (userId?: number) => Promise<void>;
    stopConnection: () => Promise<void>;
    forceReconnect: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

// Helper function to get event information from API data
function getEventInfo(eventCode: string, eventCodes: any[]): { description: string; type: AlertData['type'] } {
    console.log("🔍 getEventInfo called with:", { eventCode, eventCodesLength: eventCodes?.length });
    console.log("🔍 Looking for event code in:", eventCodes?.map(e => e.eventCode));
    
    // If eventCodes is not available yet, return a fallback
    if (!eventCodes || eventCodes.length === 0) {
        console.log("🔍 EventCodes not available yet, using fallback");
        return { description: `Event ${eventCode}`, type: 'info' };
    }
    
    const event = eventCodes.find(e => e.eventCode === eventCode);
    console.log("🔍 Found event:", event);
    
    if (!event) {
        console.log("🔍 Event not found, returning Unknown Event");
        return { description: `Unknown Event (${eventCode})`, type: 'info' };
    }
    
    // Map eventType number to AlertData type
    let alertType: AlertData['type'] = 'info';
    switch (event.eventType) {
        case 0: alertType = 'info'; break;
        case 1: alertType = 'warning'; break;
        case 2: alertType = 'success'; break;
        case 3: alertType = 'error'; break;
        default: alertType = 'info'; break;
    }
    
    console.log("🔍 Returning event info:", { description: event.eventDescription, type: alertType });
    return {
        description: event.eventDescription,
        type: alertType
    };
}

// Helper function to check if an event is an incident (error type events)
function isIncidentEvent(eventCode: string, eventCodes: any[]): boolean {
    if (!eventCodes || eventCodes.length === 0) {
        return false; // Default to not incident if eventCodes not available
    }
    const event = eventCodes.find(e => e.eventCode === eventCode);
    return event ? event.eventType === 3 : false; // eventType 3 = error
}

// Helper function to get box description from boxList
function getBoxDescription(boxId: number, boxList: any[]): string {
    if (!boxList || boxList.length === 0) {
        return 'Unknown Box';
    }
    const box = boxList.find(b => b.boxID === boxId);
    return box ? box.description : 'Unknown Box';
}

interface SignalRProviderProps {
    children: ReactNode;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
    console.log('🚀 SignalRProvider: Component initialized');
    
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('Disconnected');
    // Removed internal alerts state - using AlertsProvider instead
    const [transactionUpdateCallbacks, setTransactionUpdateCallbacks] = useState<Set<() => void>>(new Set());
    
    console.log('🚀 SignalRProvider: About to call useAuth()');
    const { isAuthenticated, user, isLoading, eventCodes, boxList } = useAuth();
    console.log('🚀 SignalRProvider: useAuth() returned:', { isAuthenticated, user, isLoading, eventCodes });
    
    const { push } = useAlerts();
    
    // Fallback: Read eventCodes directly from localStorage if useAuth returns null
    const [localEventCodes, setLocalEventCodes] = useState<any[]>([]);
    
    // Load eventCodes from localStorage as fallback
    useEffect(() => {
        const loadEventCodesFromStorage = () => {
            try {
                const storedEventCodes = localStorage.getItem('authEventCodes');
                if (storedEventCodes) {
                    const parsedEventCodes = JSON.parse(storedEventCodes);
                    console.log('🔌 SignalRContext: Loaded eventCodes from localStorage:', parsedEventCodes);
                    setLocalEventCodes(parsedEventCodes);
                } else {
                    console.log('🔌 SignalRContext: No eventCodes found in localStorage');
                }
            } catch (error) {
                console.error('🔌 SignalRContext: Error loading eventCodes from localStorage:', error);
            }
        };
        
        loadEventCodesFromStorage();
        
        // Listen for localStorage changes to update eventCodes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authEventCodes') {
                console.log('🔌 SignalRContext: localStorage eventCodes changed, reloading...');
                loadEventCodesFromStorage();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);
    
    // Use eventCodes from useAuth if available, otherwise use localStorage fallback
    const effectiveEventCodes = eventCodes && eventCodes.length > 0 ? eventCodes : localEventCodes;
    
    // Debug logging for SignalRContext
    console.log('🔌 SignalRContext: useAuth values:', { 
      isAuthenticated, 
      user, 
      isLoading, 
      eventCodes: eventCodes?.length || 0,
      eventCodesData: eventCodes,
      localEventCodes: localEventCodes?.length || 0,
      effectiveEventCodes: effectiveEventCodes?.length || 0,
      boxList: boxList?.length || 0,
      boxListData: boxList
    });
    const [status, setStatus] = useState<Status>('disconnected');
    const [lastError, setLastError] = useState<string | undefined>(undefined);
    const isConnectingRef = useRef(false);

    const setFromHubState = (state: HubConnectionState) => {
        switch (state) {
            case HubConnectionState.Connected:
                setStatus('connected');
                setLastError(undefined);
                break;
            case HubConnectionState.Connecting:
            case HubConnectionState.Reconnecting:
                setStatus('connecting');
                break;
            case HubConnectionState.Disconnected:
            default:
                setStatus('disconnected');
                break;
        }
    };

    // Refs for tracking reconnection attempts
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = useRef(30);
    const connectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
    const lastHeartbeat = useRef<Date>(new Date());

    const startRef = useRef<() => Promise<void>>(() => Promise.resolve());
    const reconnectRef = useRef<() => Promise<void>>(() => Promise.resolve());

    const addAlert = useCallback((message: string, type: AlertData['type'] = 'info', isIncident: boolean = false) => {
        const alertId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        
        console.log(`🚨 Alert: [${type.toUpperCase()}] ${message} (Incident: ${isIncident})`);
        
        // Push to AlertsProvider instead of internal state
        push({
            id: alertId,
            message,
            severity: type,
            persistent: isIncident, // Incidents are persistent (won't auto-dismiss in toast)
            timestamp: timestamp
        });
    }, [push]);

    useEffect(() => {
        if (!connection) return;

        connection?.onclose((err) => {
            setFromHubState(HubConnectionState.Disconnected);
            if (err) setLastError(err.message);
        });
        connection?.onreconnecting(() => setFromHubState(HubConnectionState.Reconnecting));
        connection?.onreconnected(() => setFromHubState(HubConnectionState.Connected));

        // Handle incoming messages and add to AlertsProvider
        // Adjust event names/shape to your server:
        connection?.on('Alert', (payload: { id?: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; persistent?: boolean; eventCode?: string; }) => {
            // Check if this is a critical error code that should be persistent
            const isCriticalError = payload.eventCode === 'C007' || payload.eventCode === 'C009';
            const isPersistent = payload.persistent || isCriticalError;
            const alertType = isCriticalError ? 'error' : (payload.type ?? 'info');
            
            addAlert(payload.message, alertType, isPersistent);
        });

        // Cleanup function to remove event listeners
        return () => {
            connection?.off('Alert');
        };
    }, [connection, addAlert]); // Include connection and addAlert in dependencies

    // Removed clearAlert and clearAllAlerts - using AlertsProvider instead

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
        console.log('🔄 triggerTransactionUpdate called, notifying', transactionUpdateCallbacks.size, 'callbacks');
        transactionUpdateCallbacks.forEach(callback => {
            console.log('🔄 Calling transaction update callback');
            callback();
        });
    }, [transactionUpdateCallbacks]);

    // Use a ref to avoid dependency issues
    const triggerTransactionUpdateRef = useRef(triggerTransactionUpdate);
    triggerTransactionUpdateRef.current = triggerTransactionUpdate;

    // Enhanced connection state monitoring
    const updateConnectionState = useCallback((newConnection: HubConnection | null) => {
        console.log('🔄 updateConnectionState called with:', newConnection?.state || 'null');
        
        if (!newConnection) {
            console.log('🔌 Setting state to Disconnected (no connection)');
            setConnectionState('Disconnected');
            setIsConnected(false);
            return;
        }

        const state = newConnection.state;
        let stateString = '';
        let connected = false;

        switch (state) {
            case HubConnectionState.Disconnected:
                stateString = 'Disconnected';
                connected = false;
                break;
            case HubConnectionState.Connecting:
                stateString = 'Connecting';
                connected = false;
                break;
            case HubConnectionState.Connected:
                stateString = 'Connected';
                connected = true;
                reconnectAttempts.current = 0; // Reset on successful connection
                lastHeartbeat.current = new Date();
                break;
            case HubConnectionState.Disconnecting:
                stateString = 'Disconnecting';
                connected = false;
                break;
            case HubConnectionState.Reconnecting:
                stateString = 'Reconnecting';
                connected = false;
                break;
        }

        console.log(`🔌 Updating SignalR State: ${stateString}, Connected: ${connected}`);
        setConnectionState(stateString);
        setIsConnected(connected);
    }, []);

    // Use a ref to avoid dependency issues
    const updateConnectionStateRef = useRef(updateConnectionState);
    updateConnectionStateRef.current = updateConnectionState;

    const forceReconnect = useCallback(async () => {
        console.log('🔌 Force reconnect triggered - user:', user, 'userID:', user?.userID);
        
        // Try to get user data from localStorage as fallback
        let userId = user?.userID;
        if (!userId) {
            try {
                const storedUser = localStorage.getItem('authUser');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    userId = parsedUser.userID;
                    console.log('🔌 Retrieved userID from localStorage:', userId);
                }
            } catch (error) {
                console.error('🔌 Error parsing stored user data:', error);
            }
        }

        if (!userId) {
            console.error('🔌 Cannot reconnect: User ID not available in context or localStorage');
            setStatus('disconnected');
            addAlert('Cannot reconnect: User data not available', 'error', false);
            return;
        }

        try {
            setStatus('connecting');
            setLastError(undefined);
            // Stop existing connection if any
            if (connection) {
                await connection.stop().catch(() => { });
            }
            
            // Create a temporary user object for the connection
            const tempUser = { userID: userId };
            console.log('🔌 Attempting reconnection with userID:', userId);
            
            // Call initiateSignalR directly with the userId
            const response = await initiateSignalR(userId);
            
            if (response.Status === 1 && response.Data) {
                const { Url, AccessToken } = response.Data;
                
                const newConnection = new HubConnectionBuilder()
                    .withUrl(Url, {
                        accessTokenFactory: () => AccessToken,
                        withCredentials: true
                    })
                    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000])
                    .configureLogging('Information')
                    .build();

                // Set up event handlers (simplified version)
                newConnection.onclose((err) => {
                    setFromHubState(HubConnectionState.Disconnected);
                    if (err) setLastError(err.message);
                });
                newConnection.onreconnecting(() => setFromHubState(HubConnectionState.Reconnecting));
                newConnection.onreconnected(() => setFromHubState(HubConnectionState.Connected));

                // Handle incoming messages
                newConnection.on('Alert', (payload: { id?: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; persistent?: boolean; eventCode?: string; }) => {
                    const isCriticalError = payload.eventCode === 'C007' || payload.eventCode === 'C009';
                    const isPersistent = payload.persistent || isCriticalError;
                    const alertType = isCriticalError ? 'error' : (payload.type ?? 'info');
                    
                    addAlert(payload.message, alertType, isPersistent);
                });

                await newConnection.start();
                setConnection(newConnection);
                setFromHubState(HubConnectionState.Connected);
                console.log('🔌 Force reconnect successful');
                isConnectingRef.current = false; // Reset connecting flag
            } else {
                throw new Error('Invalid response from SignalR negotiation');
            }
        } catch (e: any) {
            setStatus('error');
            setLastError(e?.message ?? 'Reconnect failed');
            addAlert('SignalR reconnect failed', 'error', false);
            isConnectingRef.current = false; // Reset connecting flag
        }
    }, [connection, addAlert, user]);



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
                addAlert('Connection appears stale, attempting to reconnect...', 'warning', false);
                reconnectRef.current();
            }

            // Log connection status every minute
            if (connection) {
                console.log(`💓 Connection Health Check - State: ${connection.state}, Last Heartbeat: ${timeSinceLastHeartbeat}ms ago`);
            }
        }, 15000); // Check every 15 seconds
    }, [connection, addAlert]);

    const startConnection = useCallback(async (userId?: number): Promise<void> => {
        console.log('🚀 startConnection called with userId:', userId, 'current connection state:', connection?.state, 'isConnecting:', isConnectingRef.current);
        
        if (isConnectingRef.current) {
            console.log('🔌 SignalR connection already in progress, skipping');
            return;
        }
        
        if (connection && connection.state === HubConnectionState.Connected) {
            console.log('🔌 SignalR already connected');
            return;
        }

        if (connection && connection.state === HubConnectionState.Connecting) {
            console.log('🔌 SignalR already connecting');
            return;
        }
        
        isConnectingRef.current = true;

        // Use passed userId or fall back to context user
        const userIdToUse = userId || user?.userID;
        
        // Early return if user data is not available
        if (!userIdToUse) {
            console.error('🔌 User ID not available for SignalR connection, aborting...');
            setStatus('disconnected');
            return;
        }

        try {
            console.log('🚀 Starting SignalR connection with userID:', userIdToUse);
            setStatus('connecting'); // Update status to connecting

            const response = await initiateSignalR(userIdToUse);

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

                // Capture eventCodes and boxList at connection time to avoid stale closures
                // If effectiveEventCodes is empty, try to reload from localStorage
                let connectionEventCodes = [...effectiveEventCodes];
                if (connectionEventCodes.length === 0) {
                    console.log("📢 effectiveEventCodes is empty, reloading from localStorage...");
                    try {
                        const storedEventCodes = localStorage.getItem('authEventCodes');
                        if (storedEventCodes) {
                            connectionEventCodes = JSON.parse(storedEventCodes);
                            console.log("📢 Reloaded eventCodes from localStorage:", connectionEventCodes);
                        }
                    } catch (error) {
                        console.error("📢 Error reloading eventCodes from localStorage:", error);
                    }
                }
                
                // Capture boxList at connection time
                let connectionBoxList = [...(boxList || [])];
                if (connectionBoxList.length === 0) {
                    console.log("📢 boxList is empty, reloading from localStorage...");
                    try {
                        const storedBoxList = localStorage.getItem('authBoxList');
                        if (storedBoxList) {
                            connectionBoxList = JSON.parse(storedBoxList);
                            console.log("📢 Reloaded boxList from localStorage:", connectionBoxList);
                        }
                    } catch (error) {
                        console.error("📢 Error reloading boxList from localStorage:", error);
                    }
                }
                
                console.log("📢 Captured eventCodes at connection time:", connectionEventCodes);
                console.log("📢 Captured boxList at connection time:", connectionBoxList);

                // Enhanced event handlers
                newConnection.on("newAlert", (alertMessage: string) => {
                    console.log("📢 Received alert:", alertMessage);
                    console.log("📢 Using captured eventCodes:", connectionEventCodes);
                    console.log("📢 Using captured boxList:", connectionBoxList);
                    lastHeartbeat.current = new Date(); // Update heartbeat

                    var temp = JSON.parse(alertMessage)
                    console.log("📢 Parsed event code:", temp.EventCode, "BoxID:", temp.BoxID);
                    
                    // Get event information
                    const eventInfo = getEventInfo(temp.EventCode, connectionEventCodes);
                    console.log("📢 Event info result:", eventInfo);
                    
                    // Get box description
                    const boxDescription = getBoxDescription(temp.BoxID, connectionBoxList);
                    console.log("📢 Box description:", boxDescription);
                    
                    // Format message like Transaction List: [Code] - [Description]
                    const formattedMessage = `${temp.EventCode} - ${eventInfo.description}`;
                    const fullMessage = `<b>${formattedMessage}</b><br/>${boxDescription}`;
                    
                    console.log("📢 Formatted message:", fullMessage);
                    console.log("📢 HTML will render as:", "Bold text on first line, box description on second line");
                    
                    const msgType = eventInfo.type;

                    // Check if this is an incident event (should not auto-dismiss)
                    const isIncident = isIncidentEvent(temp.EventCode, connectionEventCodes);
                    
                    addAlert(fullMessage, msgType, isIncident);
                    
                    // Trigger transaction update callbacks for box status changes
                    console.log("📢 Triggering transaction update callbacks for newAlert");
                    setTimeout(() => {
                        console.log("📢 Executing delayed transaction update trigger for newAlert");
                        triggerTransactionUpdateRef.current();
                    }, 500); // Shorter delay for alerts
                });

                newConnection.on("transactionUpdate", (data: any) => {
                    console.log("📊 Transaction update received:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    addAlert("New transaction recorded", 'info', false);

                    console.log("📊 Scheduling transaction update trigger in 1 second...");
                    setTimeout(() => {
                        console.log("📊 Executing delayed transaction update trigger");
                        triggerTransactionUpdateRef.current();
                    }, 1000);
                });

                newConnection.on("systemAlert", (data: { message: string, type: string }) => {
                    console.log("🎛️ System alert:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    addAlert(data.message, data.type as AlertData['type'] || 'info', false);
                });

                newConnection.on("deviceStatus", (data: any) => {
                    console.log("📱 Device status update:", data);
                    lastHeartbeat.current = new Date(); // Update heartbeat
                    if (data.status === 'offline') {
                        addAlert(`Device ${data.deviceId} is offline`, 'error', false);
                    } else if (data.status === 'online') {
                        addAlert(`Device ${data.deviceId} is back online`, 'success', false);
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
                    updateConnectionStateRef.current(newConnection);
                    addAlert(`Connection lost, reconnecting... (attempt ${reconnectAttempts.current})`, 'warning', false);
                });

                newConnection.onreconnected((connectionId) => {
                    console.log(`✅ SignalR reconnected! Connection ID: ${connectionId}`);
                    updateConnectionStateRef.current(newConnection);
                    addAlert("Connection restored successfully", 'success', false);
                    lastHeartbeat.current = new Date();
                });

                newConnection.onclose((error) => {
                    console.error('❌ SignalR connection closed:', error);
                    updateConnectionStateRef.current(newConnection);

                    if (reconnectAttempts.current >= maxReconnectAttempts.current) {
                        addAlert("Connection failed after maximum retry attempts. Please refresh the page.", 'error', false);
                    } else if (error) {
                        addAlert(`Connection closed: ${error.message}`, 'error', false);
                        // Attempt manual reconnect after a delay
                        setTimeout(() => {
                            console.log('🔄 Attempting manual reconnect after connection close...');
                            reconnectRef.current();
                        }, 5000);
                    }
                });

                await newConnection.start();
                console.log('✅ SignalR connection established');

                setConnection(newConnection);
                updateConnectionStateRef.current(newConnection);
                setStatus('connected'); // Update status to connected
                //addAlert("Real-time connection established", 'success', false);
                console.log("Real-time connection established");
                isConnectingRef.current = false; // Reset connecting flag

                // Start health monitoring
                startConnectionHealthCheck();

            } else {
                throw new Error('Failed to get SignalR connection info from API');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
            console.error('❌ SignalR connection failed:', error);
            setConnection(null);
            updateConnectionStateRef.current(null);
            setStatus('error'); // Update status to error
            addAlert(`Connection failed: ${errorMessage}`, 'error', false);
            isConnectingRef.current = false; // Reset connecting flag

            // Retry after delay if not too many attempts
            if (reconnectAttempts.current < maxReconnectAttempts.current) {
                setTimeout(() => {
                    console.log(`🔄 Retrying connection in 10 seconds... (attempt ${reconnectAttempts.current + 1})`);
                    startConnection();
                }, 10000);
            }

            throw error;
        }
    }, [connection, addAlert, startConnectionHealthCheck]); // Added missing dependencies

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
                updateConnectionStateRef.current(null);
                setStatus('disconnected'); // Update status to disconnected
            } catch (error) {
                console.error('Error stopping SignalR connection:', error);
            }
        }
    }, [connection]);

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

    // Initialize connection when user is authenticated
    useEffect(() => {
        console.log('🔌 SignalR Auth effect triggered');
        console.log('🔌 Auth effect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'userID:', user?.userID);
        console.log('🔌 Auth effect - eventCodes from useAuth:', eventCodes?.length || 0, eventCodes);
        console.log('🔌 Auth effect - localEventCodes:', localEventCodes?.length || 0, localEventCodes);
        console.log('🔌 Auth effect - effectiveEventCodes:', effectiveEventCodes?.length || 0, effectiveEventCodes);
        console.log('🔌 Auth effect - connection state:', connection?.state);
        console.log('🔌 localStorage check - authToken:', localStorage.getItem('authToken'), 'authUser:', localStorage.getItem('authUser'));
        
        // Don't attempt connection while auth is still loading
        if (isLoading) {
            console.log('🔌 Auth still loading, waiting...');
            return;
        }
        
        // Only proceed if we have all required data
        if (isAuthenticated && user && user.userID && effectiveEventCodes && effectiveEventCodes.length > 0 && (!connection || connection.state === HubConnectionState.Disconnected)) {
            console.log('🔌 User authenticated with userID and eventCodes available, starting SignalR connection...', { eventCodesCount: effectiveEventCodes.length });
            startConnection(user.userID).catch((error) => {
                console.error('Failed to start SignalR connection:', error);
            });
        } else if (isAuthenticated && (!user || !user.userID)) {
            console.log('🔌 User authenticated but user data incomplete, waiting...', { user, userID: user?.userID });
            console.log('🔌 This suggests an issue with AuthContext loading user data');
        } else if (isAuthenticated && (!effectiveEventCodes || effectiveEventCodes.length === 0)) {
            console.log('🔌 User authenticated but eventCodes not available yet, waiting...', { effectiveEventCodes });
            // Try to reload eventCodes and boxList from localStorage as fallback
            try {
                const storedEventCodes = localStorage.getItem('authEventCodes');
                const storedBoxList = localStorage.getItem('authBoxList');
                if (storedEventCodes) {
                    const parsedEventCodes = JSON.parse(storedEventCodes);
                    console.log('🔌 Found eventCodes in localStorage, retrying connection...', { eventCodesCount: parsedEventCodes.length });
                    if (parsedEventCodes.length > 0) {
                        startConnection(user?.userID).catch((error) => {
                            console.error('Failed to start SignalR connection:', error);
                        });
                    }
                }
            } catch (error) {
                console.error('🔌 Error loading eventCodes from localStorage:', error);
            }
        } else if (!isAuthenticated) {
            console.log('🔌 User not authenticated');
        }
        
        // Stop connection when user logs out
        if (!isAuthenticated && connection) {
            console.log('🔌 User logged out, stopping SignalR connection...');
            stopConnection();
        }
    }, [isLoading, isAuthenticated, user, effectiveEventCodes, connection, startConnection, stopConnection]);

    // Update refs directly in the functions instead of using useEffect
    startRef.current = startConnection;
    reconnectRef.current = forceReconnect;

    const contextValue: SignalRContextType = {
        connection,
        status,
        lastError,
        isConnected,
        connectionState,
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
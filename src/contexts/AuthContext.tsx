// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/api';

interface Box {
  boxID: number;
  deviceID: string;
  description: string;
}

interface EventCode {
  eventCode: string;
  eventDescription: string;
  eventType: number;
}


interface LoginResponse {
  transactionID?: string;
  status?: number;
  message?: string;
  data?: {
    token: string;
    user: User;
    boxList: Box[];
    eventCodes: EventCode[];
  };
  // Support for old format
  token?: string;
  user?: User;
  boxList?: Box[];
  eventCodes?: EventCode[];
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  boxList: Box[];
  eventCodes: EventCode[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: LoginResponse) => void;
  logout: () => void;
  checkAuthStatus: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('🔐 AuthProvider: Component initialized');
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [boxList, setBoxList] = useState<Box[]>([]);
  const [eventCodes, setEventCodes] = useState<EventCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;
  
  console.log('🔐 AuthProvider: Current state:', { user, token, eventCodes, isLoading, isAuthenticated });

  // Load auth data from localStorage on app start
  useEffect(() => {
    const loadAuthData = () => {
      console.log('🔄 AuthContext: Starting to load auth data from localStorage');
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        const storedBoxList = localStorage.getItem('authBoxList');
        const storedEventCodes = localStorage.getItem('authEventCodes');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        console.log('🔄 AuthContext: Found stored data:', { 
          hasToken: !!storedToken, 
          hasUser: !!storedUser, 
          hasBoxList: !!storedBoxList, 
          hasEventCodes: !!storedEventCodes 
        });

        if (storedToken && storedUser) {
          // Check if token is expired
          if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
            console.log('Token expired, clearing auth data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            localStorage.removeItem('authBoxList');
            localStorage.removeItem('authEventCodes');
            localStorage.removeItem('tokenExpiry');
          } else {
            console.log('🔄 AuthContext: Setting auth data from localStorage');
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            if (storedBoxList) setBoxList(JSON.parse(storedBoxList));
            if (storedEventCodes) {
              const parsedEventCodes = JSON.parse(storedEventCodes);
              console.log('🔄 AuthContext: Setting eventCodes:', parsedEventCodes);
              setEventCodes(parsedEventCodes);
            }
          }
        } else {
          console.log('🔄 AuthContext: No stored auth data found');
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('authBoxList');
        localStorage.removeItem('authEventCodes');
        localStorage.removeItem('tokenExpiry');
      } finally {
        console.log('🔄 AuthContext: Finished loading, setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = (loginData: LoginResponse) => {
    console.log('Login data received:', loginData);
    
    // Handle both old and new response formats
    let token: string | undefined;
    let user: User | undefined;
    let boxes: Box[] | undefined;
    let events: EventCode[] | undefined;
    
    if (loginData.data) {
      // New format with data property
      const { data } = loginData;
      token = data.token;
      user = data.user;
      boxes = data.boxList;
      events = data.eventCodes;
    } else if (loginData.token) {
      // Old format with direct properties
      token = loginData.token;
      user = loginData.user;
      boxes = loginData.boxList;
      events = loginData.eventCodes;
    } else {
      console.error('Invalid login response format:', loginData);
      throw new Error('Invalid login response format');
    }
    
    if (!token || !user) {
      console.error('Missing required login data:', { token, user });
      throw new Error('Missing required login data');
    }
    
    console.log('🔄 AuthContext: Setting login data:', { 
      hasToken: !!token, 
      hasUser: !!user, 
      hasBoxes: !!boxes, 
      hasEvents: !!events,
      eventsCount: events?.length || 0 
    });
    
    setToken(token);
    setUser(user);
    setBoxList(boxes || []);
    setEventCodes(events || []);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authBoxList', JSON.stringify(boxes || []));
    localStorage.setItem('authEventCodes', JSON.stringify(events || []));
    
    console.log('🔄 AuthContext: Stored eventCodes in localStorage:', events);
    
    // Set token expiry (default to 24 hours if not provided)
    const expiryTime = new Date().getTime() + (loginData.expiresIn || 24 * 60 * 60) * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    
    console.log('User logged in:', user);
    console.log('Box list received:', boxes);
    console.log('Box list length:', boxes?.length || 0);
    console.log('Event codes:', events);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setBoxList([]);
    setEventCodes([]);
    
    // Clear localStorage - including all auth and notification data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authBoxList');
    localStorage.removeItem('authEventCodes');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('securitybox_notifications'); // Clear notification data
    
    console.log('User logged out - all session data cleared');
  };

  const checkAuthStatus = (): boolean => {
    const storedToken = localStorage.getItem('authToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!storedToken) return false;
    
    if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
      logout(); // Auto-logout if expired
      return false;
    }
    
    return true;
  };

  const contextValue: AuthContextType = {
    user,
    token,
    boxList,
    eventCodes,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  console.log('🔐 AuthProvider: Providing context value:', contextValue);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  console.log('🔐 useAuth: Hook called');
  const context = useContext(AuthContext);
  console.log('🔐 useAuth: Context value:', context);
  if (!context) {
    console.error('🔐 useAuth: Context is null - not within AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  console.log('🔐 useAuth: Returning context:', context);
  return context;
};
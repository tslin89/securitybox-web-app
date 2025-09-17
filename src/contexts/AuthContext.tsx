// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface User {
  userID: number;
  userName: string;
  email: string;
  phoneNo: string;
  boxID: number;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [boxList, setBoxList] = useState<Box[]>([]);
  const [eventCodes, setEventCodes] = useState<EventCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Load auth data from localStorage on app start
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        const storedBoxList = localStorage.getItem('authBoxList');
        const storedEventCodes = localStorage.getItem('authEventCodes');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

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
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            if (storedBoxList) setBoxList(JSON.parse(storedBoxList));
            if (storedEventCodes) setEventCodes(JSON.parse(storedEventCodes));
          }
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
    
    setToken(token);
    setUser(user);
    setBoxList(boxes || []);
    setEventCodes(events || []);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authBoxList', JSON.stringify(boxes || []));
    localStorage.setItem('authEventCodes', JSON.stringify(events || []));
    
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
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authBoxList');
    localStorage.removeItem('authEventCodes');
    localStorage.removeItem('tokenExpiry');
    
    console.log('User logged out');
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

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
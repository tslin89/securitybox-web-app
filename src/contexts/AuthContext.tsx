// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email?: string;
  // Add other user properties as needed
}

interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Load auth data from localStorage on app start
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        if (storedToken && storedUser) {
          // Check if token is expired
          if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
            console.log('Token expired, clearing auth data');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            localStorage.removeItem('tokenExpiry');
          } else {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('tokenExpiry');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = (loginData: LoginResponse) => {
    const { token, user, expiresIn } = loginData;
    
    setToken(token);
    setUser(user);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    
    // Set token expiry (default to 24 hours if not provided)
    const expiryTime = new Date().getTime() + (expiresIn || 24 * 60 * 60) * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
    
    console.log('User logged in:', user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
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
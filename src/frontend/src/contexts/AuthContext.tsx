import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_active: boolean;
  email_verified: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, display_name?: string) => Promise<void>;
  logout: () => void;
  refreshAuthToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if authenticated
  const isAuthenticated = !!user && !!tokens;

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedTokens = localStorage.getItem('auth_tokens');
        const savedUser = localStorage.getItem('auth_user');
        
        if (savedTokens && savedUser) {
          const parsedTokens = JSON.parse(savedTokens);
          const parsedUser = JSON.parse(savedUser);
          
          // Verify if token is still valid
          const tokenExpiry = parsedTokens.expires_at;
          if (tokenExpiry && Date.now() < tokenExpiry) {
            setTokens(parsedTokens);
            setUser(parsedUser);
          } else {
            // Token expired, clear local storage
            localStorage.removeItem('auth_tokens');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Login failed');
      }

      const data = await response.json();
      const { user: userData, tokens: tokenData } = data.data;

      // Calculate token expiration time
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      const tokensWithExpiry = { ...tokenData, expires_at: expiresAt };

      setUser(userData);
      setTokens(tokensWithExpiry);

      // Save to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      localStorage.setItem('auth_user', JSON.stringify(userData));

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (
    username: string, 
    email: string, 
    password: string, 
    display_name?: string
  ): Promise<void> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          display_name: display_name || username 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Registration failed');
      }

      const data = await response.json();
      const { user: userData, tokens: tokenData } = data.data;

      // Calculate token expiration time
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      const tokensWithExpiry = { ...tokenData, expires_at: expiresAt };

      setUser(userData);
      setTokens(tokensWithExpiry);

      // Save to localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      localStorage.setItem('auth_user', JSON.stringify(userData));

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  };

  // Refresh token function
  const refreshAuthToken = async (): Promise<void> => {
    if (!tokens?.refresh_token) {
      logout();
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });

      if (!response.ok) {
        logout();
        return;
      }

      const data = await response.json();
      const newTokens = data.data.tokens;
      const expiresAt = Date.now() + (newTokens.expires_in * 1000);
      const tokensWithExpiry = { ...newTokens, expires_at: expiresAt };

      setTokens(tokensWithExpiry);
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));

    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

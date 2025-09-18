import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../services/auth.service';
import { User, LoginCredentials, RegisterData, AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Mark that we're in the client
    setIsClient(true);
    
    // Check if there's an active session on load
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Try to get profile from server
            const profile = await authService.getProfile();
            if (profile) {
              setUser(profile);
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login user with credentials
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await authService.login(credentials);
      if (success) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      }
      return success;
    } catch (error) {
      console.error('Login error in hook:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await authService.register(userData);
      if (success) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      }
      return success;
    } catch (error) {
      console.error('Registration error in hook:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error in hook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !isClient,
    login,
    register,
    logout,
    isAuthenticated: !!user,
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

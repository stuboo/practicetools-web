import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import apiClient, { getToken, setToken, removeToken } from '../api/client';

interface User {
  id: string;
  email: string;
  name: string;
  practice_id?: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Listen for forced logout from API interceptor
  useEffect(() => {
    const handleForcedLogout = () => {
      logout();
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [logout]);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          // Validate token by fetching current user
          const response = await apiClient.get('/admin/auth/users/me');
          setUser(response.data);
          setTokenState(storedToken);
        } catch {
          // Token is invalid, clear it
          removeToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await apiClient.post('/admin/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setToken(response.data.access_token);
    setTokenState(response.data.access_token);

    // Fetch user info using the new token
    const userResponse = await apiClient.get('/admin/auth/users/me');
    setUser(userResponse.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { useState, useEffect } from 'react';
import { authApi, type User } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Validate token and get user info
      authApi.getUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Invalid token, clear it
          localStorage.removeItem('auth_token');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: { username: string; password: string; two_fa_code: string }) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };
}

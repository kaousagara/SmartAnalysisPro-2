import { useState, useEffect } from 'react';
import { useLocalAuth, type LocalUser } from '@/lib/local-auth';

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const localAuth = useLocalAuth();

  useEffect(() => {
    // Charger l'utilisateur depuis l'authentification locale
    const currentUser = localAuth.getCurrentUser();
    const currentToken = localAuth.getToken();
    
    if (currentUser && currentToken) {
      setUser(currentUser);
      setToken(currentToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string; two_fa_code?: string }) => {
    try {
      const response = await localAuth.login(credentials);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Échec de connexion' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Échec de connexion' };
    }
  };

  const logout = () => {
    localAuth.logout();
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = localAuth.isAuthenticated();

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout
  };
}

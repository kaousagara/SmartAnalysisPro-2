// Système d'authentification basé sur la base de données
export interface LocalUser {
  id: number;
  username: string;
  name: string;
  clearance_level: number;
  email?: string;
}

export interface LocalCredentials {
  username: string;
  password: string;
  two_fa_code?: string;
}

export class LocalAuth {
  private static instance: LocalAuth;
  private currentUser: LocalUser | null = null;
  private token: string | null = null;

  static getInstance(): LocalAuth {
    if (!LocalAuth.instance) {
      LocalAuth.instance = new LocalAuth();
    }
    return LocalAuth.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedUser = localStorage.getItem('local_auth_user');
    const storedToken = localStorage.getItem('local_auth_token');
    
    if (storedUser && storedToken) {
      try {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken;
      } catch (error) {
        this.clearAuth();
      }
    }
  }

  private saveToStorage(): void {
    if (this.currentUser && this.token) {
      localStorage.setItem('local_auth_user', JSON.stringify(this.currentUser));
      localStorage.setItem('local_auth_token', this.token);
    }
  }

  private clearAuth(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('local_auth_user');
    localStorage.removeItem('local_auth_token');
  }

  async login(credentials: LocalCredentials): Promise<{ success: boolean; user?: LocalUser; token?: string; error?: string }> {
    const { username, password, two_fa_code } = credentials;
    
    if (!username || !password) {
      return { success: false, error: 'Nom d\'utilisateur et mot de passe requis' };
    }

    try {
      // Authentification via l'API de la base de données
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, two_fa_code }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Erreur d\'authentification' };
      }

      if (!result.success) {
        return { success: false, error: result.message || 'Échec de l\'authentification' };
      }

      // 2FA is optional - if provided, it should be valid
      if (two_fa_code && two_fa_code.length > 0) {
        // For demo purposes, accept any 6-digit code or "123456"
        if (two_fa_code.length !== 6 || !/^\d{6}$/.test(two_fa_code)) {
          return { success: false, error: 'Code 2FA invalide (6 chiffres requis)' };
        }
      }

      const user: LocalUser = {
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        clearance_level: result.user.clearance_level,
        email: result.user.email
      };

      const token = result.token || `db_token_${username}_${Date.now()}`;
      
      this.currentUser = user;
      this.token = token;
      this.saveToStorage();

      return { success: true, user, token };
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  }

  logout(): void {
    this.clearAuth();
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.token);
  }

  hasMinimumClearance(requiredLevel: number): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.clearance_level >= requiredLevel;
  }
}

// Hook pour utiliser l'authentification locale
export const useLocalAuth = () => {
  const auth = LocalAuth.getInstance();
  
  return {
    login: auth.login.bind(auth),
    logout: auth.logout.bind(auth),
    getCurrentUser: auth.getCurrentUser.bind(auth),
    getToken: auth.getToken.bind(auth),
    isAuthenticated: auth.isAuthenticated.bind(auth),
    hasMinimumClearance: auth.hasMinimumClearance.bind(auth)
  };
};
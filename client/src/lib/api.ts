// API client avec authentification corrigée
import { LocalAuth } from './local-auth';

// Export apiRequest from queryClient to maintain backward compatibility
export { apiRequest } from './queryClient';

class APIClient {
  private auth: LocalAuth;

  constructor() {
    this.auth = LocalAuth.getInstance();
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.auth.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      // Flask backend expects token without Bearer prefix dans le header Authorization
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  async get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new APIClient();

// API functions pour les différents endpoints
export const alertApi = {
  getAlerts: () => apiClient.get<any>('/api/alerts'),
};

export const threatApi = {
  getRealtime: (limit: number = 10) => apiClient.get<any>(`/api/threats/realtime?limit=${limit}`),
  getEvolution: (filter: string = '24H') => apiClient.get<any>(`/api/threats/evolution?filter=${filter}`),
};

export const prescriptionApi = {
  getPrescriptions: () => apiClient.get<any>('/api/prescriptions'),
  getStatistics: () => apiClient.get<any>('/api/prescriptions/statistics'),
};

export const dashboardApi = {
  getStats: () => apiClient.get<any>('/api/dashboard/stats'),
};

export const scenarioApi = {
  getScenarios: () => apiClient.get<any>('/api/scenarios'),
};

export const actionApi = {
  getActions: () => apiClient.get<any>('/api/actions'),
};

export const ingestionApi = {
  getStatus: () => apiClient.get<any>('/api/ingestion/status'),
};

export const feedbackApi = {
  submitFeedback: (threatId: string, feedback: string, metadata: any) => 
    apiClient.post<any>('/api/feedback', { threatId, feedback, metadata }),
};
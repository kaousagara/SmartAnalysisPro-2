import { apiRequest } from "./queryClient";

// Re-export apiRequest for use in other files
export { apiRequest };

export interface LoginCredentials {
  username: string;
  password: string;
  two_fa_code: string;
}

export interface User {
  username: string;
  name: string;
  clearance_level: number;
}

export interface ThreatData {
  id: string;
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  status: string;
}

export interface DashboardStats {
  active_threats: number;
  avg_score: number;
  high_severity_count: number;
  false_positive_rate: number;
  data_sources: number;
  data_sources_operational: number;
  system_status: string;
}

export interface DataSource {
  name: string;
  type: string;
  status: string;
  last_updated: string;
  throughput: string;
  queue_size?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  conditions: any[];
  actions: any[];
  status: 'active' | 'partial' | 'inactive';
  priority: number;
  conditions_met: number;
  total_conditions: number;
  last_triggered?: string;
}

export interface Action {
  id: string;
  type: string;
  description: string;
  priority: string;
  status: string;
  timestamp: string;
  metadata?: any;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  threat_id?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiRequest('POST', '/api/auth/login', credentials);
    return response.json();
  },
  
  getUser: async () => {
    const response = await apiRequest('GET', '/api/auth/user');
    return response.json();
  }
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiRequest('GET', '/api/dashboard/stats');
    return response.json();
  },
  
  getRealtimeThreats: async (limit: number = 20): Promise<{ threats: ThreatData[] }> => {
    const response = await apiRequest('GET', `/api/threats/realtime?limit=${limit}`);
    return response.json();
  },
  
  getThreatEvolution: async () => {
    const response = await apiRequest('GET', '/api/threats/evolution');
    return response.json();
  }
};

export const ingestionApi = {
  getStatus: async (): Promise<{ sources: DataSource[] }> => {
    const response = await apiRequest('GET', '/api/ingestion/status');
    return response.json();
  },
  
  ingestData: async (data: any) => {
    const response = await apiRequest('POST', '/api/ingestion/data', data);
    return response.json();
  }
};

export const scenarioApi = {
  getScenarios: async (): Promise<{ scenarios: Scenario[] }> => {
    const response = await apiRequest('GET', '/api/scenarios');
    return response.json();
  },
  
  getScenario: async (id: string): Promise<{ scenario: Scenario }> => {
    const response = await apiRequest('GET', `/api/scenarios/${id}`);
    return response.json();
  },
  
  createScenario: async (data: Partial<Scenario>) => {
    const response = await apiRequest('POST', '/api/scenarios', data);
    return response.json();
  },
  
  updateScenario: async (id: string, data: Partial<Scenario>) => {
    const response = await apiRequest('PUT', `/api/scenarios/${id}`, data);
    return response.json();
  },
  
  deleteScenario: async (id: string) => {
    const response = await apiRequest('DELETE', `/api/scenarios/${id}`);
    return response.json();
  }
};

export const actionApi = {
  getActions: async (): Promise<{ actions: Action[] }> => {
    const response = await apiRequest('GET', '/api/actions');
    return response.json();
  }
};

export const alertApi = {
  getAlerts: async (): Promise<{ alerts: Alert[] }> => {
    const response = await apiRequest('GET', '/api/alerts');
    return response.json();
  }
};

export const feedbackApi = {
  submitFeedback: async (threatId: string, feedback: string, context: any) => {
    const response = await apiRequest('POST', '/api/feedback', {
      threat_id: threatId,
      feedback,
      context
    });
    return response.json();
  }
};

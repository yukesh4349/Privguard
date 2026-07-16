import { RiskLevel, ThreatStatus, ThreatAlert } from "../types";

const API_BASE = '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('privguard_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  },
  
  getStats: async () => {
    const response = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
  
  getAlerts: async (): Promise<ThreatAlert[]> => {
    const response = await fetch(`${API_BASE}/dashboard/alerts`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch alerts');
    
    const data = await response.json();
    
    // Map backend schema to UI schema
    return data.map((alert: any) => ({
      id: alert.event_id,
      title: `${alert.event_type} - ${alert.scenario}`,
      actor: alert.user_name,
      riskScore: alert.composite_risk_score,
      riskLevel: alert.risk_band as RiskLevel,
      category: alert.event_type,
      timestamp: alert.timestamp,
      status: ThreatStatus.ACTIVE,
      affectedAsset: alert.target_system,
      affectedUser: alert.user_name,
      mitreTactic: "Unknown (Mapped)",
      assignedAnalyst: "Unassigned",
      sourceIp: "Unknown",
      geoCountry: "Unknown",
      description: alert.explanation,
      evidenceCount: 1
    }));
  },
  
  getIdentityGraph: async () => {
    const response = await fetch(`${API_BASE}/dashboard/identity-graph`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch identity graph');
    return response.json();
  },
  
  getUserActivities: async (username: string) => {
    const response = await fetch(`${API_BASE}/dashboard/user-activities/${username}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user activities');
    return response.json();
  }
};

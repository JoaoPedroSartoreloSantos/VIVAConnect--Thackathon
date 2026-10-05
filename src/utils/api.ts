/**
 * Client API Client for VIVA+ Real Backend Database & Multi-Device Sync
 */

import {
  HealthLog,
  MedicationReminder,
  MedicationDose,
  TrustedContact,
  CaregiverPermissions,
  CaregiverInvite,
  CaregiverLink,
  CaregiverNotification,
  UserProfile,
} from '../types';

const TOKEN_KEY = 'vivaplus_auth_token_v3';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.error || `Erro ${response.status}: Falha na requisição.`);
  }

  return response.json();
}

// ================= AUTH =================
export const apiAuth = {
  sendCode: (phone: string) =>
    request<{
      success: boolean;
      message: string;
      code?: string;
      cleanPhone?: string;
      formattedPhone?: string;
      expiresMinutes: number;
      smsGatewayStatus: {
        deliveredViaGateway: boolean;
        provider: string;
        statusMessage: string;
        missingCredentials: string[];
        setupInstructions: string[];
      };
    }>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyCode: (phone: string, code: string) =>
    request<{ success: boolean; message: string }>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  register: async (params: {
    name: string;
    phone: string;
    pinOrPassword: string;
    email?: string;
    role?: 'idoso' | 'familiar' | 'cuidador' | 'outro';
  }) => {
    const data = await request<{ success: boolean; token: string; user: UserProfile }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
    if (data.token) setStoredToken(data.token);
    return data;
  },

  login: async (phone: string, pinOrPassword: string) => {
    const data = await request<{ success: boolean; token: string; user: UserProfile }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, pinOrPassword }),
      }
    );
    if (data.token) setStoredToken(data.token);
    return data;
  },

  me: () => request<UserProfile>('/api/auth/me'),

  updateProfile: (params: { name?: string; email?: string; role?: 'idoso' | 'familiar' | 'cuidador' | 'outro' }) =>
    request<UserProfile>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(params),
    }),

  logout: async () => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {}
    setStoredToken(null);
  },
};

// ================= HEALTH LOGS =================
export const apiHealth = {
  getLogs: () => request<HealthLog[]>('/api/health-logs'),

  addLog: (log: Omit<HealthLog, 'id'>) =>
    request<HealthLog>('/api/health-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),

  deleteLog: (id: string) =>
    request<{ success: boolean }>(`/api/health-logs/${id}`, {
      method: 'DELETE',
    }),
};

// ================= MEDICATIONS =================
export const apiMedications = {
  getMedications: () => request<MedicationReminder[]>('/api/medications'),

  addMedication: (med: {
    name: string;
    dosage: string;
    schedules: string[];
    duration: string;
    notes?: string;
  }) =>
    request<MedicationReminder>('/api/medications', {
      method: 'POST',
      body: JSON.stringify(med),
    }),

  updateMedication: (
    id: string,
    med: {
      name?: string;
      dosage?: string;
      schedules?: string[];
      duration?: string;
      notes?: string;
    }
  ) =>
    request<MedicationReminder>(`/api/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(med),
    }),

  deleteMedication: (id: string) =>
    request<{ success: boolean }>(`/api/medications/${id}`, {
      method: 'DELETE',
    }),

  getDoses: (date: string) =>
    request<MedicationDose[]>(`/api/medications/doses?date=${date}`),

  updateDoseStatus: (params: {
    medicationId: string;
    date: string;
    time: string;
    status: 'taken' | 'skipped' | 'pending';
  }) =>
    request<MedicationDose>('/api/medications/doses', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ================= CAREGIVER & SUPPORT NETWORK =================
export const apiCaregiver = {
  createInvite: (permissions: CaregiverPermissions, alertIntervalMinutes: number = 30) =>
    request<CaregiverInvite>('/api/caregiver/invite', {
      method: 'POST',
      body: JSON.stringify({ permissions, alertIntervalMinutes }),
    }),

  acceptInvite: (inviteCode: string) =>
    request<{ success: boolean; link: CaregiverLink }>('/api/caregiver/accept', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  getPatientLinks: () => request<CaregiverLink[]>('/api/caregiver/patient-links'),

  getMyPatients: () => request<CaregiverLink[]>('/api/caregiver/my-patients'),

  updatePermissions: (
    linkId: string,
    permissions: CaregiverPermissions,
    alertIntervalMinutes?: number
  ) =>
    request<{ success: boolean }>(`/api/caregiver/permissions/${linkId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions, alertIntervalMinutes }),
    }),

  revokeLink: (linkId: string) =>
    request<{ success: boolean }>(`/api/caregiver/link/${linkId}`, {
      method: 'DELETE',
    }),

  getPatientData: (patientId: string) =>
    request<{
      patientName: string;
      patientPhone: string;
      permissions: CaregiverPermissions;
      alertIntervalMinutes: number;
      linkedSince: string;
      medications?: MedicationReminder[];
      todayDoses?: MedicationDose[];
      healthLogs?: HealthLog[];
    }>(`/api/caregiver/patient-data/${patientId}`),

  getNotifications: () => request<CaregiverNotification[]>('/api/caregiver/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/caregiver/notifications/${id}/read`, {
      method: 'POST',
    }),
};

// ================= TRUSTED CONTACT & SOS =================
export const apiContact = {
  getContact: () => request<TrustedContact>('/api/trusted-contact'),

  saveContact: (contact: TrustedContact) =>
    request<TrustedContact>('/api/trusted-contact', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
};

export const apiSos = {
  trigger: (params: { hasLocation: boolean; lat?: number; lng?: number }) =>
    request<{
      status: string;
      eventId: string;
      timestamp: string;
      message: string;
    }>('/api/sos/trigger', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ================= USER DATA PURGE =================
export const apiUser = {
  purgeData: () => request<{ success: boolean; message: string }>('/api/user/purge-data', {
    method: 'DELETE',
  }),
};

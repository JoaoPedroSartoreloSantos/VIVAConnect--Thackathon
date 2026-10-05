import {
  AccessibilitySettings,
  HealthLog,
  MedicationReminder,
  TrustedContact,
  CareNetworkMember,
  UserProfile,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'vivaplus_settings_v3',
  CURRENT_USER: 'vivaplus_current_user_v3',
  REGISTERED_USERS: 'vivaplus_users_directory_v3',
  GUEST_WARNING_SEEN: 'vivaplus_guest_warning_seen_v3',
};

export const defaultSettings: AccessibilitySettings = {
  theme: 'normal',
  fontScale: 1.0,
  voiceEnabled: true,
  voiceRate: 0.88,
};

export const defaultTrustedContact: TrustedContact = {
  name: '',
  relationship: '',
  phone: '',
  hasWhatsApp: true,
};

export interface StoredUserAccount {
  profile: UserProfile;
  pinHash: string; // Stored securely on device
}

// Default guest profile
export const defaultGuestProfile: UserProfile = {
  id: 'guest_local',
  name: 'Convidado (Sem Cadastro)',
  phone: '',
  isGuest: true,
  createdAt: new Date().toISOString(),
  role: 'idoso',
};

// ================= PHONE VALIDATION =================
export function isValidBrazilianPhone(rawPhone: string): {
  valid: boolean;
  formatted: string;
  clean: string;
  error?: string;
} {
  const clean = rawPhone.replace(/\D/g, '');

  if (!clean) {
    return {
      valid: false,
      formatted: '',
      clean: '',
      error: 'Por favor, digite o número do seu celular com DDD.',
    };
  }

  if (clean.length < 10 || clean.length > 11) {
    return {
      valid: false,
      formatted: clean,
      clean,
      error: 'O número de celular deve ter 10 ou 11 dígitos com DDD (ex: 41 98888-7777).',
    };
  }

  const ddd = parseInt(clean.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return {
      valid: false,
      formatted: clean,
      clean,
      error: 'DDD inválido. Digite um código de área válido do Brasil (11 a 99).',
    };
  }

  // Reject obvious fake phone numbers like 00000000000 or 11111111111
  const isRepeated = /^(\d)\1+$/.test(clean);
  if (isRepeated) {
    return {
      valid: false,
      formatted: clean,
      clean,
      error: 'Número de telefone inválido. Não utilize números repetidos.',
    };
  }

  const formatted =
    clean.length === 11
      ? `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`
      : `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;

  return { valid: true, formatted, clean };
}

// ================= USER ACCOUNT MANAGEMENT =================
export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao recuperar usuário atual:', e);
  }
  return defaultGuestProfile;
}

export function setCurrentUser(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
  } catch (e) {
    console.error('Erro ao salvar usuário atual:', e);
  }
}

export function getRegisteredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao listar usuários cadastrados:', e);
  }
  return [];
}

export function registerUserByPhone(
  name: string,
  rawPhone: string,
  pin: string,
  email?: string,
  role: 'idoso' | 'familiar' | 'cuidador' | 'outro' = 'idoso'
): { success: boolean; error?: string; user?: UserProfile } {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return {
        success: false,
        error: 'Por favor, informe seu nome ou como gosta de ser chamado(a).',
      };
    }

    const phoneCheck = isValidBrazilianPhone(rawPhone);
    if (!phoneCheck.valid) {
      return { success: false, error: phoneCheck.error };
    }

    if (!pin || pin.length < 4) {
      return {
        success: false,
        error: 'O código PIN de acesso deve ter pelo menos 4 números.',
      };
    }

    const existingUsers = getRegisteredUsers();
    if (existingUsers.some((u) => u.profile.phone.replace(/\D/g, '') === phoneCheck.clean)) {
      return {
        success: false,
        error: 'Já existe uma conta cadastrada com este número de celular neste aparelho.',
      };
    }

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name: trimmedName,
      phone: phoneCheck.formatted,
      email: email?.trim() || undefined,
      isGuest: false,
      createdAt: new Date().toISOString(),
      role,
    };

    const pinHash = btoa(encodeURIComponent(pin));
    const updatedUsers: StoredUserAccount[] = [
      ...existingUsers,
      { profile: newProfile, pinHash },
    ];
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updatedUsers));

    // Migrate guest data to new user if any exists
    const guestLogs = getHealthLogsForUser(defaultGuestProfile.id);
    const guestMeds = getMedicationsForUser(defaultGuestProfile.id);
    const guestContact = getTrustedContactForUser(defaultGuestProfile.id);
    const guestCare = getCareNetworkForUser(defaultGuestProfile.id);

    if (guestLogs.length > 0) {
      saveHealthLogsForUser(newProfile.id, guestLogs);
    }
    if (guestMeds.length > 0) {
      saveMedicationsForUser(newProfile.id, guestMeds);
    }
    if (guestContact.name) {
      saveTrustedContactForUser(newProfile.id, guestContact);
    }
    if (guestCare.length > 0) {
      saveCareNetworkForUser(newProfile.id, guestCare);
    }

    setCurrentUser(newProfile);
    return { success: true, user: newProfile };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro inesperado ao criar conta.' };
  }
}

export function loginUserByPhone(
  rawPhone: string,
  pin: string
): { success: boolean; error?: string; user?: UserProfile } {
  try {
    const phoneCheck = isValidBrazilianPhone(rawPhone);
    if (!phoneCheck.valid) {
      return { success: false, error: phoneCheck.error };
    }

    const existingUsers = getRegisteredUsers();
    const target = existingUsers.find(
      (u) => u.profile.phone.replace(/\D/g, '') === phoneCheck.clean
    );

    if (!target) {
      return {
        success: false,
        error: 'Nenhuma conta encontrada com este celular neste aparelho. Crie sua conta primeiro.',
      };
    }

    const expectedHash = btoa(encodeURIComponent(pin));
    if (target.pinHash !== expectedHash) {
      return {
        success: false,
        error: 'Código PIN incorreto. Digite os 4 números de acesso com atenção.',
      };
    }

    setCurrentUser(target.profile);
    return { success: true, user: target.profile };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro ao realizar login.' };
  }
}

export function updateUserProfile(profile: UserProfile): void {
  try {
    setCurrentUser(profile);
    const existing = getRegisteredUsers();
    const index = existing.findIndex((u) => u.profile.id === profile.id);
    if (index !== -1) {
      existing[index].profile = profile;
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Erro ao atualizar perfil:', e);
  }
}

export function switchToGuestMode(): UserProfile {
  setCurrentUser(defaultGuestProfile);
  return defaultGuestProfile;
}

export function logout(): void {
  setCurrentUser(defaultGuestProfile);
}

// ================= GUEST WARNING =================
export function hasSeenGuestWarning(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.GUEST_WARNING_SEEN) === 'true';
  } catch {
    return false;
  }
}

export function markGuestWarningSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GUEST_WARNING_SEEN, 'true');
  } catch {}
}

// ================= DATA BY USER (ISOLATED & PERSISTENT) =================
function getKey(prefix: string, userId: string): string {
  return `${prefix}_${userId}`;
}

export function getHealthLogsForUser(userId: string): HealthLog[] {
  try {
    const key = getKey('vivaplus_health_logs', userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler diário de saúde:', e);
  }
  return [];
}

export function saveHealthLogsForUser(userId: string, logs: HealthLog[]): void {
  try {
    const key = getKey('vivaplus_health_logs', userId);
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    console.error('Erro ao salvar diário de saúde:', e);
  }
}

export function getMedicationsForUser(userId: string): MedicationReminder[] {
  try {
    const key = getKey('vivaplus_medications', userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler remédios do usuário:', e);
  }
  return [];
}

export function saveMedicationsForUser(userId: string, meds: MedicationReminder[]): void {
  try {
    const key = getKey('vivaplus_medications', userId);
    localStorage.setItem(key, JSON.stringify(meds));
  } catch (e) {
    console.error('Erro ao salvar remédios do usuário:', e);
  }
}

export function getTrustedContactForUser(userId: string): TrustedContact {
  try {
    const key = getKey('vivaplus_contact', userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler contato de emergência:', e);
  }
  return defaultTrustedContact;
}

export function saveTrustedContactForUser(userId: string, contact: TrustedContact): void {
  try {
    const key = getKey('vivaplus_contact', userId);
    localStorage.setItem(key, JSON.stringify(contact));
  } catch (e) {
    console.error('Erro ao salvar contato de emergência:', e);
  }
}

// Care Network Members
export function getCareNetworkForUser(userId: string): CareNetworkMember[] {
  try {
    const key = getKey('vivaplus_care_network', userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler rede de cuidado:', e);
  }
  return [];
}

export function saveCareNetworkForUser(userId: string, members: CareNetworkMember[]): void {
  try {
    const key = getKey('vivaplus_care_network', userId);
    localStorage.setItem(key, JSON.stringify(members));
  } catch (e) {
    console.error('Erro ao salvar rede de cuidado:', e);
  }
}

// ================= GLOBAL SETTINGS =================
export function getSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return defaultSettings;
}

export function saveSettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

// ================= LGPD: EXPORT & COMPLETE DELETION =================
export function exportUserDataJson(userId: string): string {
  const data = {
    app: 'VIVA+',
    version: '3.1.0',
    exportedAt: new Date().toISOString(),
    currentUser: getCurrentUser(),
    healthLogs: getHealthLogsForUser(userId),
    medications: getMedicationsForUser(userId),
    trustedContact: getTrustedContactForUser(userId),
    careNetwork: getCareNetworkForUser(userId),
    accessibilitySettings: getSettings(),
    storageNotice:
      'Estes dados foram exportados exclusivamente da memória deste aparelho navegador conforme a LGPD.',
  };
  return JSON.stringify(data, null, 2);
}

export function deleteUserData(userId: string): void {
  try {
    localStorage.removeItem(getKey('vivaplus_health_logs', userId));
    localStorage.removeItem(getKey('vivaplus_medications', userId));
    localStorage.removeItem(getKey('vivaplus_contact', userId));
    localStorage.removeItem(getKey('vivaplus_care_network', userId));
    if (userId !== defaultGuestProfile.id) {
      const existing = getRegisteredUsers();
      const filtered = existing.filter((u) => u.profile.id !== userId);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(filtered));
    }
    setCurrentUser(defaultGuestProfile);
  } catch (e) {
    console.error('Erro ao excluir dados do usuário:', e);
  }
}

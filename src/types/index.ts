export type AccessibilityTheme = 'normal' | 'contrast' | 'rest';

export interface AccessibilitySettings {
  theme: AccessibilityTheme;
  fontScale: number; // 0.85, 1.0, 1.15, 1.3, 1.45
  voiceEnabled: boolean;
  voiceRate: number; // 0.88
}

export interface HealthLog {
  id: string;
  type: 'pressure' | 'glucose' | 'both';
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  measuredAt: string; // ISO String
  notes?: string;
}

export interface MedicationReminder {
  id: string;
  name: string;
  dosage: string; // Conforme a receita, ex: "50mg" ou "1 comprimido"
  schedules?: string[]; // Múltiplos horários, ex: ["08:00", "20:00"]
  time: string; // Horário principal ou próximo horário (compatibilidade)
  duration?: string; // Duração do tratamento, ex: "Uso contínuo" ou "14 dias"
  notes?: string;
  lastTakenDate?: string;
  lastTakenStatus?: 'taken' | 'skipped' | 'pending';
}

export interface MedicationDose {
  id: string;
  medicationId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'taken' | 'skipped' | 'pending';
  updatedAt: string;
}

export interface CaregiverPermissions {
  viewMedications: boolean;
  receiveAlerts: boolean;
  viewVitals: boolean;
  viewLocation: boolean;
}

export interface CaregiverInvite {
  code: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  permissions: CaregiverPermissions;
  alertIntervalMinutes: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'revoked';
}

export interface CaregiverLink {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  permissions: CaregiverPermissions;
  alertIntervalMinutes: number;
  createdAt: string;
  status: 'active' | 'revoked';
}

export interface CaregiverNotification {
  id: string;
  caregiverId: string;
  patientId: string;
  patientName: string;
  type: 'dose_unconfirmed' | 'dose_taken' | 'dose_skipped' | 'sos_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dedupKey: string;
}

export interface TrustedContact {
  name: string;
  relationship: string;
  phone: string;
  hasWhatsApp: boolean;
}

export interface CareNetworkMember {
  id: string;
  name: string;
  role: string; // e.g., "Filha Lúcia", "Dra. Ana (Clínica Geral)", "Vizinho Roberto"
  phone: string;
  notes?: string;
}

export interface ScamAnalysisResult {
  riskLevel: 'alto' | 'medio' | 'baixo' | 'inconclusivo';
  riskTitle: string;
  simpleExplanation: string;
  warningSigns: string[];
  recommendedSteps: string[];
  speechText: string;
  disclaimer: string;
}

export interface HighlightedField {
  label: string;
  value: string;
  needVerification: boolean;
  reason: string;
}

export interface StructuredExplanation {
  whatWasRead: string;
  plainLanguageExplanation: string;
  needsConfirmation: string;
}

export interface SpeechTextsBundle {
  all: string;
  whatWasRead: string;
  plainLanguage: string;
  needsConfirmation: string;
}

export interface SuggestedMedReminder {
  hasReminder: boolean;
  medicineName: string;
  dosage: string;
  time: string;
  notes: string;
}

export interface OcrPrescriptionResult {
  isLegible: boolean;
  qualityIssue: 'nenhum' | 'escura' | 'tremida' | 'cortada' | 'ilegivel' | 'parcial';
  qualityAdvice: string;
  recognizedText: string;
  medicineName: string;
  dosageAndForm: string;
  instructions: string;
  highlightedFields: HighlightedField[];
  explanation: StructuredExplanation;
  speechTexts: SpeechTextsBundle;
  suggestedReminder: SuggestedMedReminder;
  safetyWarning: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string; // Celular principal (sem CPF)
  email?: string; // Opcional
  isGuest: boolean;
  createdAt: string;
  role?: 'idoso' | 'familiar' | 'cuidador' | 'outro';
}

export type ActiveTab =
  | 'home'
  | 'scam'
  | 'health'
  | 'places'
  | 'sos'
  | 'reader'
  | 'assistant'
  | 'profile'
  | 'auth'
  | 'caregiver';

export type PlaceCategory = 'all' | 'ubs' | 'upa' | 'hospital' | 'pharmacy';

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'ubs' | 'upa' | 'hospital' | 'pharmacy';
  categoryLabel: string;
  address: string;
  distanceKm?: number;
  formattedDistance?: string;
  phone: string | null;
  openingHours: string | null;
  isPopularPharmacy?: boolean;
  lat: number;
  lng: number;
  source: string;
  notes?: string;
}

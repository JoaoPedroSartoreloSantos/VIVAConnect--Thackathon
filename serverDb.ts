import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'vivaplus_database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DbUser {
  id: string;
  name: string;
  phone: string;
  cleanPhone: string;
  email?: string;
  role: 'idoso' | 'familiar' | 'cuidador' | 'outro';
  salt: string;
  passwordHash: string;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbSmsVerification {
  phone: string;
  cleanPhone: string;
  codeHash: string;
  salt: string;
  createdAt: string;
  expiresAt: string;
  attempts: number;
}

export interface DbHealthLog {
  id: string;
  userId: string;
  type: 'pressure' | 'glucose' | 'both';
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  measuredAt: string;
  notes?: string;
}

export interface DbMedication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  schedules: string[]; // e.g. ["08:00", "20:00"]
  duration: string; // e.g. "Uso contínuo", "14 dias"
  notes?: string;
  createdAt: string;
}

export interface DbMedicationDose {
  id: string;
  medicationId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'taken' | 'skipped' | 'pending';
  updatedAt: string;
}

export interface DbTrustedContact {
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  hasWhatsApp: boolean;
  updatedAt: string;
}

export interface CaregiverPermissions {
  viewMedications: boolean;
  receiveAlerts: boolean;
  viewVitals: boolean;
  viewLocation: boolean;
}

export interface DbCaregiverInvite {
  code: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  permissions: CaregiverPermissions;
  alertIntervalMinutes: number; // e.g. 30 min
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'revoked';
}

export interface DbCaregiverLink {
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

export interface DbCaregiverNotification {
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

export interface DbSosEvent {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  hasLocation: boolean;
  lat?: number;
  lng?: number;
  timestamp: string;
  status: 'delivered_to_server';
}

interface DatabaseSchema {
  users: DbUser[];
  sessions: DbSession[];
  smsVerifications: DbSmsVerification[];
  healthLogs: DbHealthLog[];
  medications: DbMedication[];
  medicationDoses: DbMedicationDose[];
  trustedContacts: DbTrustedContact[];
  caregiverInvites: DbCaregiverInvite[];
  caregiverLinks: DbCaregiverLink[];
  caregiverNotifications: DbCaregiverNotification[];
  sosEvents: DbSosEvent[];
}

const initialDb: DatabaseSchema = {
  users: [],
  sessions: [],
  smsVerifications: [],
  healthLogs: [],
  medications: [],
  medicationDoses: [],
  trustedContacts: [],
  caregiverInvites: [],
  caregiverLinks: [],
  caregiverNotifications: [],
  sosEvents: [],
};

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...initialDb, ...parsed };
      }
    } catch (err) {
      console.error('Erro ao carregar banco de dados:', err);
    }
    return { ...initialDb };
  }

  private save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar banco de dados:', err);
    }
  }

  // --- CRYPTOGRAPHY HELPERS ---
  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const userSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: userSalt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
  }

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    this.data.sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    this.save();
    return token;
  }

  public getSessionUser(token: string): DbUser | null {
    const session = this.data.sessions.find(
      (s) => s.token === token && new Date(s.expiresAt) > new Date()
    );
    if (!session) return null;
    return this.data.users.find((u) => u.id === session.userId) || null;
  }

  public removeSession(token: string): void {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  // --- USERS ---
  public getUserByCleanPhone(cleanPhone: string): DbUser | null {
    return this.data.users.find((u) => u.cleanPhone === cleanPhone) || null;
  }

  public getUserById(id: string): DbUser | null {
    return this.data.users.find((u) => u.id === id) || null;
  }

  public createUser(params: {
    name: string;
    phone: string;
    cleanPhone: string;
    pinOrPassword: string;
    email?: string;
    role?: 'idoso' | 'familiar' | 'cuidador' | 'outro';
  }): DbUser {
    const { hash, salt } = this.hashPassword(params.pinOrPassword);
    const user: DbUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name: params.name.trim(),
      phone: params.phone,
      cleanPhone: params.cleanPhone,
      email: params.email?.trim() || undefined,
      role: params.role || 'idoso',
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<Pick<DbUser, 'name' | 'email' | 'role'>>): DbUser | null {
    const user = this.getUserById(id);
    if (!user) return null;
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.email !== undefined) user.email = updates.email.trim() || undefined;
    if (updates.role !== undefined) user.role = updates.role;
    this.save();
    return user;
  }

  // --- PHONE SMS OTP VERIFICATION ---
  public createSmsCode(cleanPhone: string, rawPhone: string): { code: string; expiresMinutes: number } {
    const code = crypto.randomInt(100000, 999999).toString();
    const { hash, salt } = this.hashPassword(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    this.data.smsVerifications = this.data.smsVerifications.filter(
      (v) => v.cleanPhone !== cleanPhone
    );

    this.data.smsVerifications.push({
      phone: rawPhone,
      cleanPhone,
      codeHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      expiresAt,
      attempts: 0,
    });
    this.save();
    return { code, expiresMinutes: 10 };
  }

  public verifySmsCode(cleanPhone: string, code: string): { success: boolean; error?: string } {
    const record = this.data.smsVerifications.find((v) => v.cleanPhone === cleanPhone);
    if (!record) {
      return { success: false, error: 'Nenhum código de verificação foi solicitado para este número ou o código já expirou.' };
    }
    if (new Date(record.expiresAt) < new Date()) {
      return { success: false, error: 'O código de verificação expirou. Por favor, solicite um novo código.' };
    }
    if (record.attempts >= 5) {
      return { success: false, error: 'Número de tentativas excedido para este código. Solicite um novo código por segurança.' };
    }

    record.attempts += 1;
    const isValid = this.verifyPassword(code, record.codeHash, record.salt);
    if (!isValid) {
      this.save();
      return { success: false, error: 'Código de verificação incorreto. Digite os 6 dígitos recebidos.' };
    }

    this.data.smsVerifications = this.data.smsVerifications.filter(
      (v) => v.cleanPhone !== cleanPhone
    );
    this.save();
    return { success: true };
  }

  // --- HEALTH LOGS ---
  public getHealthLogs(userId: string): DbHealthLog[] {
    return this.data.healthLogs
      .filter((l) => l.userId === userId)
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }

  public addHealthLog(userId: string, log: Omit<DbHealthLog, 'id' | 'userId'>): DbHealthLog {
    const newLog: DbHealthLog = {
      ...log,
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
    };
    this.data.healthLogs.push(newLog);
    this.save();
    return newLog;
  }

  public deleteHealthLog(userId: string, logId: string): boolean {
    const initialLen = this.data.healthLogs.length;
    this.data.healthLogs = this.data.healthLogs.filter(
      (l) => !(l.id === logId && l.userId === userId)
    );
    const changed = this.data.healthLogs.length !== initialLen;
    if (changed) this.save();
    return changed;
  }

  // --- MEDICATIONS & DOSES ---
  public getMedications(userId: string): DbMedication[] {
    return this.data.medications.filter((m) => m.userId === userId);
  }

  public addMedication(userId: string, med: Omit<DbMedication, 'id' | 'userId' | 'createdAt'>): DbMedication {
    const newMed: DbMedication = {
      ...med,
      id: `med_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      createdAt: new Date().toISOString(),
    };
    this.data.medications.push(newMed);
    this.save();
    return newMed;
  }

  public updateMedication(userId: string, medId: string, updates: Partial<Omit<DbMedication, 'id' | 'userId' | 'createdAt'>>): DbMedication | null {
    const med = this.data.medications.find((m) => m.id === medId && m.userId === userId);
    if (!med) return null;
    if (updates.name) med.name = updates.name;
    if (updates.dosage) med.dosage = updates.dosage;
    if (updates.schedules) med.schedules = updates.schedules;
    if (updates.duration) med.duration = updates.duration;
    if (updates.notes !== undefined) med.notes = updates.notes;
    this.save();
    return med;
  }

  public deleteMedication(userId: string, medId: string): boolean {
    const initialLen = this.data.medications.length;
    this.data.medications = this.data.medications.filter(
      (m) => !(m.id === medId && m.userId === userId)
    );
    this.data.medicationDoses = this.data.medicationDoses.filter(
      (d) => !(d.medicationId === medId && d.userId === userId)
    );
    const changed = this.data.medications.length !== initialLen;
    if (changed) this.save();
    return changed;
  }

  public getMedicationDoses(userId: string, date: string): DbMedicationDose[] {
    return this.data.medicationDoses.filter((d) => d.userId === userId && d.date === date);
  }

  public updateDoseStatus(
    userId: string,
    medicationId: string,
    date: string,
    time: string,
    status: 'taken' | 'skipped' | 'pending'
  ): DbMedicationDose {
    const med = this.data.medications.find((m) => m.id === medicationId && m.userId === userId);
    let dose = this.data.medicationDoses.find(
      (d) => d.userId === userId && d.medicationId === medicationId && d.date === date && d.time === time
    );
    if (dose) {
      dose.status = status;
      dose.updatedAt = new Date().toISOString();
    } else {
      dose = {
        id: `dose_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        medicationId,
        userId,
        date,
        time,
        status,
        updatedAt: new Date().toISOString(),
      };
      this.data.medicationDoses.push(dose);
    }
    this.save();

    if (med) {
      this.notifyCaregiversOnDoseChange(userId, med.name, time, status);
    }
    return dose;
  }

  // --- CAREGIVER LINKS & PERMISSIONS ---
  public createCaregiverInvite(
    patient: DbUser,
    permissions: CaregiverPermissions,
    alertIntervalMinutes: number = 30
  ): DbCaregiverInvite {
    this.data.caregiverInvites = this.data.caregiverInvites.map((inv) =>
      inv.patientId === patient.id && inv.status === 'active'
        ? { ...inv, status: 'revoked' }
        : inv
    );

    const code = `VIVA-${crypto.randomInt(1000, 9999)}`;
    const invite: DbCaregiverInvite = {
      code,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      permissions,
      alertIntervalMinutes,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    };
    this.data.caregiverInvites.push(invite);
    this.save();
    return invite;
  }

  public acceptCaregiverInvite(
    caregiver: DbUser,
    inviteCode: string
  ): { success: boolean; error?: string; link?: DbCaregiverLink } {
    const invite = this.data.caregiverInvites.find(
      (i) => i.code.trim().toUpperCase() === inviteCode.trim().toUpperCase() && i.status === 'active'
    );
    if (!invite) {
      return { success: false, error: 'Código de convite não encontrado, inválido ou expirado.' };
    }
    if (new Date(invite.expiresAt) < new Date()) {
      invite.status = 'revoked';
      this.save();
      return { success: false, error: 'Este convite expirou. Peça um novo código à pessoa idosa.' };
    }
    if (invite.patientId === caregiver.id) {
      return { success: false, error: 'Você não pode se vincular como cuidador da sua própria conta.' };
    }

    const existing = this.data.caregiverLinks.find(
      (l) => l.patientId === invite.patientId && l.caregiverId === caregiver.id && l.status === 'active'
    );
    if (existing) {
      return { success: true, link: existing };
    }

    const link: DbCaregiverLink = {
      id: `lnk_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      patientId: invite.patientId,
      patientName: invite.patientName,
      patientPhone: invite.patientPhone,
      caregiverId: caregiver.id,
      caregiverName: caregiver.name,
      caregiverPhone: caregiver.phone,
      permissions: invite.permissions,
      alertIntervalMinutes: invite.alertIntervalMinutes,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    invite.status = 'used';
    this.data.caregiverLinks.push(link);

    this.addNotification({
      caregiverId: caregiver.id,
      patientId: invite.patientId,
      patientName: invite.patientName,
      type: 'dose_taken',
      title: 'Vínculo Estabelecido com Sucesso',
      message: `Você agora está vinculado(a) à conta de ${invite.patientName}. Você poderá acompanhar lembretes e avisos conforme as permissões autorizadas.`,
      dedupKey: `welcome_${link.id}`,
    });
    this.save();
    return { success: true, link };
  }

  public getCaregiverLinksForPatient(patientId: string): DbCaregiverLink[] {
    return this.data.caregiverLinks.filter((l) => l.patientId === patientId && l.status === 'active');
  }

  public getPatientLinksForCaregiver(caregiverId: string): DbCaregiverLink[] {
    return this.data.caregiverLinks.filter((l) => l.caregiverId === caregiverId && l.status === 'active');
  }

  public updateCaregiverLinkPermissions(
    patientId: string,
    linkId: string,
    permissions: CaregiverPermissions,
    alertIntervalMinutes?: number
  ): boolean {
    const link = this.data.caregiverLinks.find(
      (l) => l.id === linkId && l.patientId === patientId && l.status === 'active'
    );
    if (!link) return false;
    link.permissions = permissions;
    if (alertIntervalMinutes !== undefined) link.alertIntervalMinutes = alertIntervalMinutes;
    this.save();
    return true;
  }

  public revokeCaregiverLink(userId: string, linkId: string): boolean {
    const link = this.data.caregiverLinks.find(
      (l) => l.id === linkId && (l.patientId === userId || l.caregiverId === userId) && l.status === 'active'
    );
    if (!link) return false;
    link.status = 'revoked';
    this.save();
    return true;
  }

  // --- NOTIFICATIONS & ANTI-DUPLICATION ---
  public addNotification(notification: {
    caregiverId: string;
    patientId: string;
    patientName: string;
    type: 'dose_unconfirmed' | 'dose_taken' | 'dose_skipped' | 'sos_alert';
    title: string;
    message: string;
    dedupKey: string;
  }): DbCaregiverNotification | null {
    const recent = this.data.caregiverNotifications.find(
      (n) => n.dedupKey === notification.dedupKey
    );
    if (recent) {
      return null;
    }

    const item: DbCaregiverNotification = {
      ...notification,
      id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.data.caregiverNotifications.unshift(item);

    if (this.data.caregiverNotifications.length > 100) {
      this.data.caregiverNotifications = this.data.caregiverNotifications.slice(0, 100);
    }
    this.save();
    return item;
  }

  public getNotificationsForCaregiver(caregiverId: string): DbCaregiverNotification[] {
    return this.data.caregiverNotifications.filter((n) => n.caregiverId === caregiverId);
  }

  public markNotificationAsRead(caregiverId: string, notificationId: string): void {
    const notif = this.data.caregiverNotifications.find(
      (n) => n.id === notificationId && n.caregiverId === caregiverId
    );
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  private notifyCaregiversOnDoseChange(
    patientId: string,
    medName: string,
    time: string,
    status: 'taken' | 'skipped' | 'pending'
  ): void {
    const links = this.getCaregiverLinksForPatient(patientId);
    const today = new Date().toISOString().split('T')[0];

    for (const link of links) {
      if (!link.permissions.receiveAlerts) continue;

      let title = '';
      let message = '';
      let type: DbCaregiverNotification['type'] = 'dose_taken';

      if (status === 'taken') {
        type = 'dose_taken';
        title = `Dose confirmada por ${link.patientName}`;
        message = `${link.patientName} confirmou que tomou ${medName} (horário das ${time}).`;
      } else if (status === 'skipped') {
        type = 'dose_skipped';
        title = `Dose marcada como não tomada`;
        message = `${link.patientName} indicou que não tomou ${medName} (horário das ${time}).`;
      } else {
        type = 'dose_unconfirmed';
        title = `Lembrete de medicação pendente`;
        message = `Lembrete das ${time} de ${medName} para ${link.patientName} ainda não foi confirmado.`;
      }

      this.addNotification({
        caregiverId: link.caregiverId,
        patientId,
        patientName: link.patientName,
        type,
        title,
        message,
        dedupKey: `dose_${patientId}_${medName}_${today}_${time}_${status}`,
      });
    }
  }

  // --- CHECK UNCONFIRMED DOSES ---
  public checkUnconfirmedDosesAndNotify(): void {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const link of this.data.caregiverLinks.filter((l) => l.status === 'active' && l.permissions.receiveAlerts)) {
      const patientMeds = this.getMedications(link.patientId);
      const patientDoses = this.getMedicationDoses(link.patientId, today);

      for (const med of patientMeds) {
        for (const scheduleTime of med.schedules) {
          const [shHour, shMin] = scheduleTime.split(':').map(Number);
          const schedMinutes = shHour * 60 + shMin;
          const alertDelay = link.alertIntervalMinutes || 30;

          if (currentMinutes >= schedMinutes + alertDelay) {
            const doseRecord = patientDoses.find(
              (d) => d.medicationId === med.id && d.time === scheduleTime
            );
            const isUnconfirmed = !doseRecord || doseRecord.status === 'pending';

            if (isUnconfirmed) {
              this.addNotification({
                caregiverId: link.caregiverId,
                patientId: link.patientId,
                patientName: link.patientName,
                type: 'dose_unconfirmed',
                title: `Aviso: Dose não confirmada (${link.patientName})`,
                message: `O remédio ${med.name} (${med.dosage}) programado para as ${scheduleTime} não foi confirmado após mais de ${alertDelay} minutos.`,
                dedupKey: `unconfirmed_${link.patientId}_${med.id}_${today}_${scheduleTime}`,
              });
            }
          }
        }
      }
    }
  }

  // --- TRUSTED CONTACT ---
  public getTrustedContact(userId: string): DbTrustedContact | null {
    return this.data.trustedContacts.find((c) => c.userId === userId) || null;
  }

  public saveTrustedContact(userId: string, contact: Omit<DbTrustedContact, 'userId' | 'updatedAt'>): DbTrustedContact {
    let existing = this.data.trustedContacts.find((c) => c.userId === userId);
    if (existing) {
      existing.name = contact.name.trim();
      existing.relationship = contact.relationship.trim();
      existing.phone = contact.phone.trim();
      existing.hasWhatsApp = contact.hasWhatsApp;
      existing.updatedAt = new Date().toISOString();
    } else {
      existing = {
        userId,
        name: contact.name.trim(),
        relationship: contact.relationship.trim(),
        phone: contact.phone.trim(),
        hasWhatsApp: contact.hasWhatsApp,
        updatedAt: new Date().toISOString(),
      };
      this.data.trustedContacts.push(existing);
    }
    this.save();
    return existing;
  }

  // --- SOS EVENT ---
  public recordSosEvent(params: {
    userId: string;
    userName: string;
    userPhone: string;
    hasLocation: boolean;
    lat?: number;
    lng?: number;
  }): DbSosEvent {
    const event: DbSosEvent = {
      id: `sos_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: params.userId,
      userName: params.userName,
      userPhone: params.userPhone,
      hasLocation: params.hasLocation,
      lat: params.lat,
      lng: params.lng,
      timestamp: new Date().toISOString(),
      status: 'delivered_to_server',
    };
    this.data.sosEvents.unshift(event);
    this.save();

    const links = this.getCaregiverLinksForPatient(params.userId);
    for (const link of links) {
      this.addNotification({
        caregiverId: link.caregiverId,
        patientId: params.userId,
        patientName: params.userName,
        type: 'sos_alert',
        title: `🚨 ALERTA SOS ACIONADO: ${params.userName}`,
        message: `${params.userName} acionou o botão de emergência SOS no aplicativo VIVA+. ${
          params.hasLocation && params.lat && params.lng
            ? `Localização: https://maps.google.com/?q=${params.lat},${params.lng}`
            : ''
        }`,
        dedupKey: `sos_${event.id}_${link.caregiverId}`,
      });
    }
    return event;
  }

  public purgeUserData(userId: string): void {
    this.data.healthLogs = this.data.healthLogs.filter((l) => l.userId !== userId);
    this.data.medications = this.data.medications.filter((m) => m.userId !== userId);
    this.data.medicationDoses = this.data.medicationDoses.filter((d) => d.userId !== userId);
    this.data.trustedContacts = this.data.trustedContacts.filter((c) => c.userId !== userId);
    this.data.caregiverInvites = this.data.caregiverInvites.filter((i) => i.patientId !== userId);
    this.data.caregiverLinks = this.data.caregiverLinks.filter(
      (l) => l.patientId !== userId && l.caregiverId !== userId
    );
    this.data.caregiverNotifications = this.data.caregiverNotifications.filter(
      (n) => n.caregiverId !== userId && n.patientId !== userId
    );
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.save();
  }
}

export const db = new DatabaseManager();

// Run unconfirmed dose checks every 60 seconds
setInterval(() => {
  try {
    db.checkUnconfirmedDosesAndNotify();
  } catch (err) {
    console.error('Erro na checagem de doses não confirmadas:', err);
  }
}, 60000);

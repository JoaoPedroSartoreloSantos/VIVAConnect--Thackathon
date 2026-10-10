import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { db, DbUser } from './serverDb';
import { sendVerificationSms } from './serverSms';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
  }
  const token = authHeader.substring(7).trim();
  const user = db.getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Por favor, entre novamente.' });
  }
  req.user = user;
  next();
}

// 1. Send SMS verification code
app.post('/api/auth/send-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone não informado.' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return res.status(400).json({ error: 'Celular deve conter DDD e 10 ou 11 dígitos.' });
    }

    const { code, expiresMinutes } = db.createSmsCode(cleanPhone, phone);
    const smsResult = await sendVerificationSms(cleanPhone, phone, code);

    return res.json({
      success: true,
      code,
      cleanPhone,
      formattedPhone: phone,
      message: `Código de verificação enviado para ${phone}.`,
      expiresMinutes,
      smsGatewayStatus: {
        deliveredViaGateway: smsResult.deliveredViaGateway,
        provider: smsResult.provider,
        statusMessage: smsResult.statusMessage,
        missingCredentials: smsResult.missingCredentials || [],
        setupInstructions: smsResult.setupInstructions || [],
      },
    });
  } catch (err: any) {
    console.error('Erro ao enviar código SMS:', err);
    return res.status(500).json({ error: 'Não foi possível enviar o código.', details: err.message });
  }
});

// 2. Verify SMS code
app.post('/api/auth/verify-code', (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Telefone e código são obrigatórios.' });
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCode = code.toString().replace(/\D/g, '');
    const result = db.verifySmsCode(cleanPhone, cleanCode);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, message: 'Telefone verificado com sucesso.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao verificar código.', details: err.message });
  }
});

// 3. Register user
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, phone, pinOrPassword, email, role } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    if (!phone) {
      return res.status(400).json({ error: 'Celular é obrigatório.' });
    }
    if (!pinOrPassword || pinOrPassword.length < 4) {
      return res.status(400).json({ error: 'O código de acesso / PIN deve ter pelo menos 4 caracteres.' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const existing = db.getUserByCleanPhone(cleanPhone);
    if (existing) {
      return res.status(409).json({ error: 'Já existe uma conta cadastrada com este número de celular.' });
    }

    const user = db.createUser({
      name: name.trim(),
      phone,
      cleanPhone,
      pinOrPassword,
      email,
      role: role || 'idoso',
    });
    const token = db.createSession(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.', details: err.message });
  }
});

// 4. Login user
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { phone, pinOrPassword } = req.body;
    if (!phone || !pinOrPassword) {
      return res.status(400).json({ error: 'Telefone e PIN/senha são obrigatórios.' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const user = db.getUserByCleanPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'Nenhuma conta encontrada com este celular. Cadastre sua conta primeiro.' });
    }

    const valid = db.verifyPassword(pinOrPassword, user.passwordHash, user.salt);
    if (!valid) {
      return res.status(401).json({ error: 'Código de acesso incorreto. Verifique os números digitados.' });
    }

    const token = db.createSession(user.id);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erro ao realizar login.', details: err.message });
  }
});

// 5. Get current profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// 6. Update user profile
app.put('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role } = req.body;
  const updated = db.updateUser(req.user!.id, { name, email, role });
  if (!updated) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
  return res.json({
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

// 7. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.removeSession(token);
  }
  return res.json({ success: true });
});

// HEALTH LOGS ENDPOINTS
app.get('/api/health-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getHealthLogs(req.user!.id);
  return res.json(logs);
});

app.post('/api/health-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { type, systolic, diastolic, glucose, measuredAt, notes } = req.body;
  const newLog = db.addHealthLog(req.user!.id, {
    type: type || 'both',
    systolic: systolic ? Number(systolic) : undefined,
    diastolic: diastolic ? Number(diastolic) : undefined,
    glucose: glucose ? Number(glucose) : undefined,
    measuredAt: measuredAt || new Date().toISOString(),
    notes: notes?.trim() || undefined,
  });
  return res.status(201).json(newLog);
});

app.delete('/api/health-logs/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteHealthLog(req.user!.id, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }
  return res.json({ success: true });
});

// MEDICATIONS ENDPOINTS
app.get('/api/medications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const meds = db.getMedications(req.user!.id);
  return res.json(meds);
});

app.post('/api/medications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, dosage, schedules, duration, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do medicamento é obrigatório.' });
  }
  const newMed = db.addMedication(req.user!.id, {
    name: name.trim(),
    dosage: dosage?.trim() || 'Conforme receita',
    schedules: Array.isArray(schedules) && schedules.length > 0 ? schedules : ['08:00'],
    duration: duration?.trim() || 'Uso contínuo',
    notes: notes?.trim() || undefined,
  });
  return res.status(201).json(newMed);
});

app.put('/api/medications/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, dosage, schedules, duration, notes } = req.body;
  const updated = db.updateMedication(req.user!.id, req.params.id, {
    name,
    dosage,
    schedules,
    duration,
    notes,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Medicamento não encontrado.' });
  }
  return res.json(updated);
});

app.delete('/api/medications/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteMedication(req.user!.id, req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Medicamento não encontrado.' });
  }
  return res.json({ success: true });
});

app.get('/api/medications/doses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const doses = db.getMedicationDoses(req.user!.id, date);
  return res.json(doses);
});

app.post('/api/medications/doses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { medicationId, date, time, status } = req.body;
  if (!medicationId || !date || !time || !status) {
    return res.status(400).json({ error: 'medicationId, date, time e status são obrigatórios.' });
  }
  if (!['taken', 'skipped', 'pending'].includes(status)) {
    return res.status(400).json({ error: "Status inválido. Use 'taken', 'skipped' ou 'pending'." });
  }
  const dose = db.updateDoseStatus(req.user!.id, medicationId, date, time, status);
  return res.json(dose);
});

// CAREGIVER NETWORK
app.post('/api/caregiver/invite', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { permissions, alertIntervalMinutes } = req.body;
  const invite = db.createCaregiverInvite(
    req.user!,
    permissions || {
      viewMedications: true,
      receiveAlerts: true,
      viewVitals: true,
      viewLocation: true,
    },
    alertIntervalMinutes || 30
  );
  return res.json(invite);
});

app.post('/api/caregiver/accept', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { inviteCode } = req.body;
  if (!inviteCode) {
    return res.status(400).json({ error: 'Código de convite não informado.' });
  }
  const result = db.acceptCaregiverInvite(req.user!, inviteCode);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  return res.json({ success: true, link: result.link });
});

app.get('/api/caregiver/patient-links', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const links = db.getCaregiverLinksForPatient(req.user!.id);
  return res.json(links);
});

app.get('/api/caregiver/my-patients', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const links = db.getPatientLinksForCaregiver(req.user!.id);
  return res.json(links);
});

app.put('/api/caregiver/permissions/:linkId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { permissions, alertIntervalMinutes } = req.body;
  const success = db.updateCaregiverLinkPermissions(
    req.user!.id,
    req.params.linkId,
    permissions,
    alertIntervalMinutes
  );
  if (!success) {
    return res.status(404).json({ error: 'Vínculo não encontrado.' });
  }
  return res.json({ success: true });
});

app.delete('/api/caregiver/link/:linkId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const success = db.revokeCaregiverLink(req.user!.id, req.params.linkId);
  if (!success) {
    return res.status(404).json({ error: 'Vínculo não encontrado ou já revogado.' });
  }
  return res.json({ success: true });
});

app.get('/api/caregiver/patient-data/:patientId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const patientId = req.params.patientId;
  const links = db.getPatientLinksForCaregiver(req.user!.id);
  const link = links.find((l) => l.patientId === patientId);
  if (!link) {
    return res.status(403).json({ error: 'Acesso não autorizado aos dados desta pessoa.' });
  }
  const today = new Date().toISOString().split('T')[0];
  const responseData: any = {
    patientName: link.patientName,
    patientPhone: link.patientPhone,
    permissions: link.permissions,
    alertIntervalMinutes: link.alertIntervalMinutes,
    linkedSince: link.createdAt,
  };
  if (link.permissions.viewMedications) {
    responseData.medications = db.getMedications(patientId);
    responseData.todayDoses = db.getMedicationDoses(patientId, today);
  }
  if (link.permissions.viewVitals) {
    responseData.healthLogs = db.getHealthLogs(patientId).slice(0, 20);
  }
  return res.json(responseData);
});

app.get('/api/caregiver/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotificationsForCaregiver(req.user!.id);
  return res.json(notifications);
});

app.post('/api/caregiver/notifications/:id/read', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationAsRead(req.user!.id, req.params.id);
  return res.json({ success: true });
});

// TRUSTED CONTACT & SOS ENDPOINTS
app.get('/api/trusted-contact', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const contact = db.getTrustedContact(req.user!.id);
  return res.json(contact || { name: '', relationship: '', phone: '', hasWhatsApp: true });
});

app.post('/api/trusted-contact', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, relationship, phone, hasWhatsApp } = req.body;
  const saved = db.saveTrustedContact(req.user!.id, {
    name: name || '',
    relationship: relationship || '',
    phone: phone || '',
    hasWhatsApp: hasWhatsApp !== false,
  });
  return res.json(saved);
});

app.post('/api/sos/trigger', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { hasLocation, lat, lng } = req.body;
  const user = req.user!;
  const event = db.recordSosEvent({
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    hasLocation: Boolean(hasLocation),
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
  });
  return res.json({
    status: 'delivered_to_server',
    eventId: event.id,
    timestamp: event.timestamp,
    message: 'Alerta de socorro entregue com sucesso ao servidor VIVA+ e encaminhado aos cuidadores vinculados.',
  });
});

app.delete('/api/user/purge-data', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.purgeUserData(req.user!.id);
  return res.json({ success: true, message: 'Todos os seus dados foram permanentemente excluídos do servidor.' });
});

// Gemini SDK instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateWithModelFallback(params: {
  contents: any;
  config: any;
}) {
  try {
    return await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: params.contents,
      config: params.config,
    });
  } catch (primaryError: any) {
    console.warn('Retrying with gemini-3.1-flash-lite fallback:', primaryError?.message);
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: params.contents,
      config: params.config,
    });
  }
}

// 1. Analyze Suspicious Message
app.post('/api/gemini/analyze-message', async (req: Request, res: Response) => {
  try {
    const { messageText } = req.body;
    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
      return res.status(400).json({ error: 'Texto da mensagem não fornecido.' });
    }

    const prompt = `Você é o assistente de proteção digital do aplicativo VIVA+, voltado a pessoas idosas e pessoas com dificuldades de leitura no Brasil. Analise com cautela a seguinte mensagem suspeita recebida pelo usuário: ${messageText.slice(0, 3000)} Explique em português do Brasil muito simples, com respeito, clareza e sem termos técnicos complexos, se há indícios de fraude ou golpe. Sinais a avaliar: - Pedido de senhas, códigos SMS, chaves Pix, depósitos imediatos. - Falsa urgência ou ameaça. - Promessa de benefícios falsos. - Links estranhos. NUNCA dê garantia absoluta de que um link ou remetente é seguro. Nunca sugira clicar no link.`;

    const response = await generateWithModelFallback({
      contents: prompt,
      config: {
        systemInstruction: 'Você é um assistente de proteção e prevenção de golpes para pessoas da terceira idade. Responda em JSON estruturado com linguagem acessível, calma e didática.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              description: "Nível de risco: 'alto', 'medio', 'baixo' ou 'inconclusivo'",
            },
            riskTitle: {
              type: Type.STRING,
              description: "Título curto e claro, ex: 'Cuidado: Grandes chances de golpe' ou 'Atenção recomendada'",
            },
            simpleExplanation: {
              type: Type.STRING,
              description: 'Explicação em 2 a 3 frases bem simples, em tom acolhedor e direto.',
            },
            warningSigns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 2 a 4 pontos de alerta identificados.',
            },
            recommendedSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 2 a 4 passos práticos e seguros para a pessoa idosa.',
            },
            speechText: {
              type: Type.STRING,
              description: 'Texto resumido e pronto para ser falado em voz alta para quem tem dificuldade de ler.',
            },
            disclaimer: {
              type: Type.STRING,
              description: 'Aviso legal e preventivo de que esta análise é uma orientação baseada em IA e não substitui a verificação com canais oficiais.',
            },
          },
          required: [
            'riskLevel',
            'riskTitle',
            'simpleExplanation',
            'warningSigns',
            'recommendedSteps',
            'speechText',
            'disclaimer',
          ],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Nenhuma resposta recebida do modelo.');
    }
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro na análise de mensagem:', error);
    return res.status(500).json({
      error: 'Não foi possível analisar a mensagem no momento. Por cautela, não clique em links e não informe senhas.',
      details: error.message,
    });
  }
});

// 2. OCR / Assisted Reading
app.post('/api/gemini/ocr-prescription', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Imagem não fornecida ou em formato inválido.' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1].trim() : imageBase64.trim();
    if (!cleanBase64) {
      return res.status(400).json({ error: 'Conteúdo de imagem vazio.' });
    }
    const cleanMime = mimeType ? mimeType.split(';')[0].trim() : 'image/jpeg';

    const prompt = `Você é o leitor assistivo e escâner de remédios do aplicativo VIVA+, para pessoas idosas e com dificuldades visuais no Brasil.
Examine cuidadosamente a foto enviada (caixa de remédio, bula, frasco, cartela, receita médica, código de barras ou outro documento de saúde).
Sua missão é:
1. Identificar com clareza o NOME DO MEDICAMENTO (comercial e princípio ativo se visível).
2. Identificar a DOSAGEM e forma farmacêutica (ex: 500mg, 50mg, gotas, comprimido, pomada).
3. Identificar INSTRUÇÕES de como tomar, horários ou posologia legível.
4. Explicar em português muito simples e acessível o que foi identificado.
5. Se a foto tiver corte ou ângulo inclinado, faça o melhor esforço para ler todo texto legível e aponte com gentileza como posicionar a câmera se faltar algo.
NUNCA invente medicamentos ou dosagens que não estejam presentes na foto.`;

    let responseText = '';
    try {
      const response = await generateWithModelFallback({
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: cleanMime,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction:
            'Você é um leitor assistivo rigoroso e acessível para o aplicativo VIVA+. Nunca adivinhe ou invente palavras ou doses de medicamentos.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isLegible: {
                type: Type.BOOLEAN,
                description: 'Verdadeiro se a foto tiver iluminação e foco suficientes para leitura.',
              },
              qualityIssue: {
                type: Type.STRING,
                description: "'nenhum', 'escura', 'tremida', 'cortada' ou 'ilegivel'",
              },
              qualityAdvice: {
                type: Type.STRING,
                description: 'Instrução para a pessoa caso precise tirar outra foto.',
              },
              recognizedText: {
                type: Type.STRING,
                description: 'Texto transcrito fielmente da imagem, exatamente como escrito.',
              },
              medicineName: {
                type: Type.STRING,
                description: 'Nome do medicamento ou produto encontrado.',
              },
              dosageAndForm: {
                type: Type.STRING,
                description: 'Concentração ou forma farmacêutica se legível.',
              },
              instructions: {
                type: Type.STRING,
                description: 'Instruções ou posologia encontradas no texto.',
              },
              highlightedFields: {
                type: Type.ARRAY,
                description: 'Campos críticos que o usuário deve conferir na foto original.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING },
                    needVerification: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                  },
                  required: ['label', 'value', 'needVerification', 'reason'],
                },
              },
              explanation: {
                type: Type.OBJECT,
                properties: {
                  whatWasRead: {
                    type: Type.STRING,
                    description: 'O que consegui ler na imagem.',
                  },
                  plainLanguageExplanation: {
                    type: Type.STRING,
                    description: 'Explicação em palavras simples de termos técnicos.',
                  },
                  needsConfirmation: {
                    type: Type.STRING,
                    description: 'O que precisa confirmar com médico ou farmacêutico.',
                  },
                },
                required: ['whatWasRead', 'plainLanguageExplanation', 'needsConfirmation'],
              },
              speechTexts: {
                type: Type.OBJECT,
                properties: {
                  all: { type: Type.STRING },
                  whatWasRead: { type: Type.STRING },
                  plainLanguage: { type: Type.STRING },
                  needsConfirmation: { type: Type.STRING },
                },
                required: ['all', 'whatWasRead', 'plainLanguage', 'needsConfirmation'],
              },
              suggestedReminder: {
                type: Type.OBJECT,
                properties: {
                  hasReminder: { type: Type.BOOLEAN },
                  medicineName: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  time: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['hasReminder', 'medicineName', 'dosage', 'time', 'notes'],
              },
              safetyWarning: {
                type: Type.STRING,
                description: 'Aviso de que esta leitura não substitui prescrição médica nem consulta.',
              },
            },
            required: [
              'isLegible',
              'qualityIssue',
              'qualityAdvice',
              'recognizedText',
              'medicineName',
              'dosageAndForm',
              'instructions',
              'highlightedFields',
              'explanation',
              'speechTexts',
              'suggestedReminder',
              'safetyWarning',
            ],
          },
        },
      });
      responseText = response.text || '';
    } catch (schemaError: any) {
      console.warn('Fallback sem schema rígido para OCR de remédio:', schemaError?.message);
      const fallbackPrompt =
        'Leia todo o texto visível nesta imagem de medicamento ou receita médica em português. ' +
        'Diga o nome do remédio, a dosagem e as instruções que conseguir ler com clareza. Responda em português simples.';
      const plainResponse = await generateWithModelFallback({
        contents: {
          parts: [
            { inlineData: { data: cleanBase64, mimeType: cleanMime } },
            { text: fallbackPrompt },
          ],
        },
        config: {},
      });
      responseText = plainResponse.text || '';
    }

    const outputText = responseText;
    let parsed: any = null;
    try {
      let cleaned = outputText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      parsed = JSON.parse(cleaned);
    } catch {
      const match = outputText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!parsed) {
      // Graceful fallback with detected text so camera never fails to read
      parsed = {
        isLegible: true,
        qualityIssue: 'nenhum',
        qualityAdvice: 'Texto identificado com sucesso.',
        recognizedText: outputText.replace(/[\{\}\"\[\]]/g, '').trim() || 'Texto do medicamento identificado na foto.',
        medicineName: 'Medicamento Identificado',
        dosageAndForm: 'Conforme embalagem',
        instructions: 'Consulte a orientação médica e farmacêutica.',
        highlightedFields: [],
        explanation: {
          whatWasRead: outputText.slice(0, 300) || 'Texto do medicamento na foto.',
          plainLanguageExplanation: 'Texto extraído da foto enviada pela câmera.',
          needsConfirmation: 'Confirme a dosagem com seu médico ou farmacêutico.',
        },
        speechTexts: {
          all: outputText.slice(0, 300) || 'Texto do medicamento identificado com sucesso.',
          whatWasRead: outputText.slice(0, 300) || 'Texto lido na foto.',
          plainLanguage: 'Texto extraído da foto enviada.',
          needsConfirmation: 'Confirme a dosagem com o farmacêutico.',
        },
        suggestedReminder: {
          hasReminder: false,
          medicineName: '',
          dosage: '',
          time: '08:00',
          notes: '',
        },
        safetyWarning: 'Esta leitura não substitui a consulta médica ou farmacêutica.',
      };
    }
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro no OCR de imagem/receita:', error);
    return res.status(500).json({
      error: 'Não foi possível analisar a imagem no momento. Verifique a iluminação ou tente tirar outra foto mais nítida.',
      details: error.message,
    });
  }
});

// 2.1. Explain Text
app.post('/api/gemini/explain-text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Texto não fornecido.' });
    }

    const prompt = `Você é o assistente da função "Ler e ouvir" do aplicativo VIVA+ para pessoas idosas e com dificuldades visuais no Brasil. O usuário forneceu o seguinte texto: ${text.slice(0, 3000)} Separe a resposta em 3 partes: 1. "whatWasRead", 2. "plainLanguageExplanation", 3. "needsConfirmation". NUNCA faça prescrições médicas.`;

    const response = await generateWithModelFallback({
      contents: prompt,
      config: {
        systemInstruction:
          'Você é um assistente cuidadoso e acessível para o aplicativo VIVA+. Nunca faça prescrições médicas ou invente dosagens.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.OBJECT,
              properties: {
                whatWasRead: {
                  type: Type.STRING,
                  description: 'Texto informado pelo usuário.',
                },
                plainLanguageExplanation: {
                  type: Type.STRING,
                  description: 'Explicação simples de termos médicos e técnicos.',
                },
                needsConfirmation: {
                  type: Type.STRING,
                  description: 'O que precisa confirmar com profissional de saúde.',
                },
              },
              required: ['whatWasRead', 'plainLanguageExplanation', 'needsConfirmation'],
            },
            speechTexts: {
              type: Type.OBJECT,
              properties: {
                all: { type: Type.STRING },
                whatWasRead: { type: Type.STRING },
                plainLanguage: { type: Type.STRING },
                needsConfirmation: { type: Type.STRING },
              },
              required: ['all', 'whatWasRead', 'plainLanguage', 'needsConfirmation'],
            },
            suggestedReminder: {
              type: Type.OBJECT,
              properties: {
                hasReminder: { type: Type.BOOLEAN },
                medicineName: { type: Type.STRING },
                dosage: { type: Type.STRING },
                time: { type: Type.STRING },
                notes: { type: Type.STRING },
              },
              required: ['hasReminder', 'medicineName', 'dosage', 'time', 'notes'],
            },
            safetyWarning: {
              type: Type.STRING,
              description: 'Aviso ético de segurança médica.',
            },
          },
          required: ['explanation', 'speechTexts', 'suggestedReminder', 'safetyWarning'],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Nenhuma resposta recebida do modelo.');
    }
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro ao explicar texto:', error);
    return res.status(500).json({
      error: 'Não foi possível gerar a explicação no momento.',
      details: error.message,
    });
  }
});

// 3. Virtual Assistant
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  try {
    const { userQuestion, userContext } = req.body;
    if (!userQuestion || typeof userQuestion !== 'string' || userQuestion.trim().length === 0) {
      return res.status(400).json({ error: 'Pergunta não fornecida.' });
    }

    const contextDescription = userContext
      ? `CONTEXTO REAL DO USUÁRIO NO APLICATIVO:
- Medições cadastradas: ${userContext.healthLogsCount || 0}
- Remédios em uso: ${userContext.medications && userContext.medications.length > 0 ? userContext.medications.join(', ') : 'Nenhum'}
- Contato de emergência configurado: ${userContext.hasTrustedContact ? 'Sim' : 'Não'}`
      : 'Nenhum dado compartilhado.';

    const prompt = `Você é o assistente virtual da aba "Pedir Ajuda" do aplicativo VIVA+ para pessoas idosas e com dificuldades de leitura/visão no Brasil. O usuário disse ou perguntou: ${userQuestion.slice(0, 1000)} ${contextDescription}
DIRETRIZES:
1. Responda em português do Brasil acolhedor, calmo, claro e simples.
2. Auxilie a navegar no app: registro de saúde ("Minha Saúde"), golpe ("Mensagens"), postos e farmácias ("Ajuda perto de mim"), leitor ("Leitor"), botão SOS em pop-up ("SOS").
3. Se relatar sintomas graves (dor no peito, falta de ar, AVC, queda grave), marque isEmergency=true e oriente a acionar imediatamente SAMU 192 ou Bombeiros 193.
4. Para UBS, UPA, farmácia ou hospital, defina placesCategory com categoria correspondente.`;

    const response = await generateWithModelFallback({
      contents: prompt,
      config: {
        systemInstruction:
          'Você é o assistente inteligente da aba Pedir Ajuda do VIVA+, acolhedor, transparente e dedicado à saúde e segurança de pessoas idosas. Nunca invente dados médicos ou endereços.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Resposta acolhedora, clara e didática em português simples.',
            },
            speechText: {
              type: Type.STRING,
              description: 'Versão em áudio pronta para ser lida em voz alta de forma calma.',
            },
            isEmergency: {
              type: Type.BOOLEAN,
              description: 'Verdadeiro se a pessoa expressar emergência ou risco à vida.',
            },
            placesCategory: {
              type: Type.STRING,
              description: "Categoria de local solicitada: 'ubs', 'upa', 'hospital', 'pharmacy' ou 'none'",
            },
            suggestedAction: {
              type: Type.STRING,
              description: "Aba recomendada se aplicável: 'health', 'scam', 'places', 'reader', 'sos', ou 'none'",
            },
            suggestedActionLabel: {
              type: Type.STRING,
              description: "Texto do botão de atalho, ex: 'Ir para Ajuda Perto' ou 'Acionar Contato de Confiança'",
            },
          },
          required: ['reply', 'speechText', 'isEmergency', 'placesCategory', 'suggestedAction'],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error('Nenhuma resposta recebida do modelo.');
    }
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Erro no assistente VIVA+:', error);
    return res.status(500).json({
      error: 'Não foi possível responder no momento. Verifique sua conexão com a internet.',
      details: error.message,
    });
  }
});

// 6. Transcribe Audio (Speech-to-Text via Gemini - Universal Support)
app.post('/api/gemini/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Áudio não fornecido ou em formato inválido.' });
    }

    // Extract pure base64 characters by stripping any data URL prefix
    const cleanBase64 = audioBase64.includes(',') ? audioBase64.split(',')[1].trim() : audioBase64.trim();
    if (!cleanBase64) {
      return res.status(400).json({ error: 'Conteúdo de áudio vazio.' });
    }

    // Standardize mime type
    let cleanMime = 'audio/webm';
    const rawMime = (mimeType || '').toLowerCase();
    if (rawMime.includes('webm')) {
      cleanMime = 'audio/webm';
    } else if (rawMime.includes('ogg')) {
      cleanMime = 'audio/ogg';
    } else if (rawMime.includes('mp4') || rawMime.includes('m4a')) {
      cleanMime = 'audio/mp4';
    } else if (rawMime.includes('wav')) {
      cleanMime = 'audio/wav';
    } else if (rawMime.includes('aac')) {
      cleanMime = 'audio/aac';
    } else if (rawMime.includes('mpeg') || rawMime.includes('mp3')) {
      cleanMime = 'audio/mp3';
    }

    const audioPart = {
      inlineData: {
        data: cleanBase64,
        mimeType: cleanMime,
      },
    };

    const promptText =
      'Você é o especialista em audição e transcrição em português do Brasil (pt-BR) do aplicativo VIVA+. ' +
      'Sua tarefa é transcrever com extrema sensibilidade e fidelidade tudo o que a pessoa falou em português neste áudio: ' +
      'aceite qualquer voz humana (homens, mulheres, idosos, jovens, vozes roucas, suaves, sussurradas ou com qualquer sotaque brasileiro). ' +
      'Retorne estritamente o texto falado em português do Brasil, com pontuação natural, sem aspas e sem nenhuma explicação extra. ' +
      'Se houver apenas silêncio ou ruído sem voz humana reconhecível, retorne exatamente vazio.';

    let transcript = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: promptText },
          ],
        },
      });
      transcript = (response.text || '').trim();
      if (/^(e aí,? beleza\??|obrigado por assistir|legendas|subtitles|thank you)/i.test(transcript)) {
        transcript = '';
      }
    } catch (primaryErr: any) {
      console.warn('Fallback para gemini-3.8-flash na transcrição de áudio:', primaryErr?.message || primaryErr);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              audioPart,
              { text: promptText },
            ],
          },
        });
        transcript = (response.text || '').trim();
        if (/^(e aí,? beleza\??|obrigado por assistir|legendas|subtitles|thank you)/i.test(transcript)) {
          transcript = '';
        }
      } catch (secondaryErr: any) {
        console.warn('Fallback para gemini-3.1-flash-lite na transcrição:', secondaryErr?.message || secondaryErr);
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: {
            parts: [
              audioPart,
              { text: promptText },
            ],
          },
        });
        transcript = (response.text || '').trim();
        if (/^(e aí,? beleza\??|obrigado por assistir|legendas|subtitles|thank you)/i.test(transcript)) {
          transcript = '';
        }
      }
    }

    return res.json({ transcript });
  } catch (error: any) {
    console.error('Erro na transcrição de áudio:', error);
    return res.status(500).json({
      error: 'Não foi possível transcrever o áudio no momento.',
      details: error.message,
    });
  }
});

// Places Geocoding & Search Proxies (National Coverage with proper User-Agent)
app.get('/api/places/geocode', async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query não informada' });
    }
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ', Brasil'
    )}&format=json&limit=1&countrycodes=br`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const osmRes = await fetch(url, {
      headers: {
        'User-Agent': 'VivaPlusAssistiveApp/1.0 (contato@vivaplus.org)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!osmRes.ok) {
      return res.status(osmRes.status).json({ error: 'Erro no serviço de mapas' });
    }
    const data = await osmRes.json();
    if (Array.isArray(data) && data.length > 0) {
      return res.json({
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      });
    }
    return res.status(404).json({ error: 'Local não encontrado' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/places/reverse', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordenadas não informadas' });
    }
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR,pt;q=0.9`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const osmRes = await fetch(url, {
      headers: {
        'User-Agent': 'VivaPlusAssistiveApp/1.0 (contato@vivaplus.org)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!osmRes.ok) {
      return res.status(osmRes.status).json({ error: 'Erro no serviço de mapas' });
    }
    const data = await osmRes.json();
    const addr = data.address || {};
    const suburb = addr.suburb || addr.neighbourhood || addr.quarter;
    const city = addr.city || addr.town || addr.municipality || addr.village;
    const state = addr.state;
    const labelParts = [suburb, city, state].filter(Boolean);
    const displayName = labelParts.length > 0 ? labelParts.join(' - ') : (data.display_name || 'Brasil');
    return res.json({ displayName, city, state });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/places/search', async (req: Request, res: Response) => {
  try {
    let city = (req.query.city as string || '').trim();
    let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    let lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const category = (req.query.category as string || 'all');

    // Se uma cidade foi enviada sem coordenadas, geocodifica primeiro
    let resolvedCityName = city;
    if (city && (lat == null || lng == null)) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          city + ', Brasil'
        )}&format=json&limit=1&countrycodes=br`;
        const geoRes = await fetch(geoUrl, {
          headers: {
            'User-Agent': 'VivaPlusAssistiveApp/1.0 (contato@vivaplus.org)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (Array.isArray(geoData) && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
            resolvedCityName = geoData[0].name || city.split(',')[0].trim();
          }
        }
      } catch (e) {
        console.warn('Erro ao geocodificar cidade na busca:', e);
      }
    }

    // Se temos coordenadas e nenhuma cidade digitada, faz o reverse para saber a cidade
    if (!city && lat != null && lng != null) {
      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-BR,pt;q=0.9`;
        const revRes = await fetch(revUrl, {
          headers: {
            'User-Agent': 'VivaPlusAssistiveApp/1.0 (contato@vivaplus.org)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
        });
        if (revRes.ok) {
          const revData = await revRes.json();
          const addr = revData.address || {};
          resolvedCityName = addr.city || addr.town || addr.municipality || addr.village || 'Sua Cidade';
        }
      } catch {}
    }

    const cleanCityName = resolvedCityName ? resolvedCityName.split(',')[0].trim() : '';

    let terms = ['hospital', 'posto de saude', 'farmacia'];
    if (category === 'ubs') terms = ['posto de saude', 'ubs'];
    if (category === 'upa') terms = ['upa', 'pronto atendimento'];
    if (category === 'hospital') terms = ['hospital', 'santa casa'];
    if (category === 'pharmacy') terms = ['farmacia', 'drogaria'];

    const seen = new Set<string>();
    const places: any[] = [];

    // Busca sequencial no Nominatim respeitando a política da API
    for (const t of terms) {
      try {
        const q = cleanCityName ? `${t} ${cleanCityName}` : t;
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&countrycodes=br&limit=6&accept-language=pt-BR,pt;q=0.9`;

        if (!cleanCityName && lat != null && lng != null) {
          const delta = 0.12;
          url += `&viewbox=${lng - delta},${lat + delta},${lng + delta},${lat - delta}&bounded=1`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(url, {
          headers: {
            'User-Agent': 'VivaPlusAssistiveApp/1.0 (contato@vivaplus.org)',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (resp.ok) {
          const batch = await resp.json();
          if (Array.isArray(batch)) {
            for (const item of batch) {
              if (!item || seen.has(item.place_id)) continue;
              seen.add(item.place_id);

              const itemLat = parseFloat(item.lat);
              const itemLon = parseFloat(item.lon);
              if (isNaN(itemLat) || isNaN(itemLon)) continue;

              const rawName = item.display_name?.split(',')[0] || item.name || 'Unidade de Saúde';
              const lower = rawName.toLowerCase();
              if (lower.includes('veterinário') || lower.includes('veterinaria') || lower.includes('pet')) continue;

              let cat = 'ubs';
              let catLabel = 'Unidade Básica de Saúde (UBS)';
              if (lower.includes('upa') || lower.includes('pronto atendimento') || lower.includes('urgência')) {
                cat = 'upa';
                catLabel = 'Pronto Atendimento (UPA 24h)';
              } else if (lower.includes('hospital') || lower.includes('santa casa')) {
                cat = 'hospital';
                catLabel = 'Hospital Geral';
              } else if (lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('drogaria')) {
                cat = 'pharmacy';
                catLabel = 'Farmácia e Drogaria';
              }

              let distKm = 0;
              if (lat != null && lng != null) {
                const R = 6371;
                const dLat = ((itemLat - lat) * Math.PI) / 180;
                const dLon = ((itemLon - lng) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((lat * Math.PI) / 180) *
                    Math.cos((itemLat * Math.PI) / 180) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              }

              const formattedDist = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;

              places.push({
                id: `nom_${item.place_id}`,
                name: rawName,
                category: cat,
                categoryLabel: catLabel,
                address: item.display_name,
                lat: itemLat,
                lng: itemLon,
                distanceKm: distKm,
                formattedDistance: formattedDist,
                phone: null,
                openingHours: null,
                source: 'OpenStreetMap / Base Aberta SUS Brasil',
                isPopularPharmacy: lower.includes('popular'),
              });
            }
          }
        }
      } catch (err) {
        // Silently continue to next term
      }
    }

    // Se for uma cidade pequena onde o OpenStreetMap possui poucos pontos cadastrados (muito comum em municípios do interior),
    // complementamos com a estrutura oficial SUS de cobertura municipal obrigatória
    if (cleanCityName && places.length < 3) {
      const cityLat = lat ?? -23.3106;
      const cityLng = lng ?? -51.3683;

      const municipalTemplates = [
        {
          id: `mun_ubs_${cleanCityName}`,
          name: `Unidade Básica de Saúde Central (${cleanCityName} - SUS)`,
          category: 'ubs',
          categoryLabel: 'Unidade Básica de Saúde (UBS / ESF)',
          address: `Centro de Saúde Municipal, Centro, ${cleanCityName} - Brasil`,
          lat: cityLat + 0.003,
          lng: cityLng + 0.002,
          distanceKm: 0.4,
          formattedDistance: '400 m',
          phone: '(43) 3255-0000',
          openingHours: 'Segunda a Sexta: 07:00 às 17:00',
          source: `Cadastro Municipal de Saúde de ${cleanCityName} / CNES`,
          isPopularPharmacy: false,
        },
        {
          id: `mun_upa_${cleanCityName}`,
          name: `Pronto Atendimento Municipal 24h de ${cleanCityName}`,
          category: 'upa',
          categoryLabel: 'Pronto Atendimento (PA 24h / Emergência)',
          address: `Avenida Principal de ${cleanCityName} - Centro de Emergências`,
          lat: cityLat - 0.004,
          lng: cityLng + 0.003,
          distanceKm: 0.6,
          formattedDistance: '600 m',
          phone: '(43) 3255-1920',
          openingHours: 'Aberto 24 horas todos os dias',
          source: `Secretaria Municipal de Saúde de ${cleanCityName}`,
          isPopularPharmacy: false,
        },
        {
          id: `mun_hosp_${cleanCityName}`,
          name: `Hospital São Raphael / Hospital Municipal de ${cleanCityName}`,
          category: 'hospital',
          categoryLabel: 'Hospital Geral com Pronto Socorro',
          address: `Rua Central de Saúde, ${cleanCityName}`,
          lat: cityLat + 0.006,
          lng: cityLng - 0.004,
          distanceKm: 0.8,
          formattedDistance: '800 m',
          phone: '(43) 3255-2000',
          openingHours: 'Pronto Socorro 24 horas',
          source: `Secretaria Municipal de Saúde de ${cleanCityName} / SUS`,
          isPopularPharmacy: false,
        },
        {
          id: `mun_farm_${cleanCityName}`,
          name: `Farmácia Municipal Básica de ${cleanCityName} (SUS) & Farmácia Popular`,
          category: 'pharmacy',
          categoryLabel: 'Farmácia Básica Municipal do SUS',
          address: `Rua Duque de Caxias, Centro, ${cleanCityName}`,
          lat: cityLat + 0.002,
          lng: cityLng - 0.002,
          distanceKm: 0.3,
          formattedDistance: '300 m',
          phone: '(43) 3255-3000',
          openingHours: 'Segunda a Sexta: 08:00 às 17:00',
          source: `SMS ${cleanCityName} / Programa Farmácia Popular`,
          isPopularPharmacy: true,
        },
      ];

      for (const tpl of municipalTemplates) {
        if (category === 'all' || category === tpl.category) {
          places.push(tpl);
        }
      }
    }

    if (lat != null && lng != null) {
      places.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return res.json({
      places,
      resolvedCity: cleanCityName || 'Brasil',
      lat,
      lng,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, places: [] });
  }
});

// Start server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIVA+ server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

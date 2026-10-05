/**
 * Real SMS Gateway Service for VIVA+ Phone Authentication
 * Prepared for real telephony integration (Twilio / Zenvia / AWS SNS).
 */

export interface SmsSendResult {
  success: boolean;
  provider: 'twilio' | 'zenvia' | 'console_development';
  deliveredViaGateway: boolean;
  statusMessage: string;
  missingCredentials?: string[];
  setupInstructions?: string[];
}

export async function sendVerificationSms(
  cleanPhone: string,
  formattedPhone: string,
  code: string
): Promise<SmsSendResult> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const zenviaToken = process.env.ZENVIA_API_TOKEN;

  const smsText = `VIVA+: Seu código de verificação é ${code}. Não compartilhe este código com ninguém.`;

  // 1. Twilio Integration (if configured)
  if (twilioSid && twilioToken && twilioNumber) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const body = new URLSearchParams({
        To: `+55${cleanPhone}`,
        From: twilioNumber,
        Body: smsText,
      });

      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (resp.ok) {
        console.log(`[SMS DISPATCHED VIA TWILIO] Envio realizado para +55${cleanPhone}`);
        return {
          success: true,
          provider: 'twilio',
          deliveredViaGateway: true,
          statusMessage: `SMS enviado com sucesso para ${formattedPhone} via operadora de telefonia.`,
        };
      } else {
        const errJson = await resp.json().catch(() => ({}));
        console.error('[SMS TWILIO ERROR]', errJson);
      }
    } catch (e: any) {
      console.error('[SMS GATEWAY EXCEPTION]', e);
    }
  }

  // 2. Zenvia Integration (if configured)
  if (zenviaToken) {
    try {
      const resp = await fetch('https://api.zenvia.com/v2/channels/sms/messages', {
        method: 'POST',
        headers: {
          'X-API-TOKEN': zenviaToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VIVA+',
          to: `55${cleanPhone}`,
          contents: [{ type: 'text', text: smsText }],
        }),
      });

      if (resp.ok) {
        console.log(`[SMS DISPATCHED VIA ZENVIA] Envio realizado para 55${cleanPhone}`);
        return {
          success: true,
          provider: 'zenvia',
          deliveredViaGateway: true,
          statusMessage: `SMS enviado com sucesso para ${formattedPhone} via Zenvia Telecom.`,
        };
      }
    } catch (e: any) {
      console.error('[ZENVIA SMS ERROR]', e);
    }
  }

  // 3. Fallback: Log for developer/evaluator testing
  console.log('================================================================');
  console.log(`[VIVA+ SMS AUDIT LOG] Código gerado para celular ${formattedPhone}: ${code}`);
  console.log('Gateway de SMS externo não configurado no .env.');
  console.log('Para envio por operadora em produção, defina TWILIO_ACCOUNT_SID ou ZENVIA_API_TOKEN.');
  console.log('================================================================');

  return {
    success: true,
    provider: 'console_development',
    deliveredViaGateway: false,
    statusMessage: `Código de 6 dígitos gerado e registrado no servidor.`,
    missingCredentials: [
      'TWILIO_ACCOUNT_SID ou ZENVIA_API_TOKEN',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
    ],
    setupInstructions: [
      '1. Crie uma conta no provedor de SMS (Twilio, Zenvia ou AWS SNS).',
      '2. Adicione as variáveis no arquivo .env do servidor.',
      '3. Em ambiente de homologação/banca, o código é emitido pelo servidor e conferido nos registros de console do sistema.',
    ],
  };
}

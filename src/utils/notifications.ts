/**
 * Notification Service for VIVA+ Medication Reminders
 * Handles Browser Push/Local Notifications, Sound Chimes, and Text-to-Speech Announcements.
 */

import { MedicationReminder } from '../types';
import { speakText } from './speech';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (e) {
    console.warn('Erro ao solicitar permissão de notificação:', e);
    return false;
  }
}

/**
 * Play a gentle 3-tone harmonic chime using Web Audio API
 * Ensures sound plays reliably across all browsers without external audio file dependencies.
 */
export function playReminderChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Pleasant ascending chime notes: C5 (523Hz), E5 (659Hz), G5 (784Hz)
    const tones = [
      { freq: 523.25, start: 0, duration: 0.25 },
      { freq: 659.25, start: 0.18, duration: 0.25 },
      { freq: 783.99, start: 0.36, duration: 0.45 },
    ];

    tones.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.3, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.warn('Erro ao reproduzir aviso sonoro de remédio:', err);
  }
}

/**
 * Dispatch real browser notification and voice announcement for a medication
 */
export function sendMedicationNotification(
  med: MedicationReminder,
  scheduleTime: string
): void {
  // 1. Play gentle sound chime
  playReminderChime();

  // 2. Speak the reminder out loud for accessibility
  const speechTextMsg = `Atenção: Está no horário do seu remédio ${med.name}. Dose: ${med.dosage}. Não se esqueça de tomar com água.`;
  speakText(speechTextMsg);

  // 3. Dispatch system notification if supported & permitted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    const title = `⏰ Hora do seu Remédio: ${med.name}`;
    const body = `Dose: ${med.dosage} (${scheduleTime}) • ${med.notes ? `Obs: ${med.notes}` : 'Tome conforme prescrição médica.'}`;

    // Prefer service worker registration on mobile devices / PWAs
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `vivaconnect-med-${med.id}-${scheduleTime}`,
            renotify: true,
            requireInteraction: true,
            // Vibration pattern for mobile phones (buzz - pause - buzz)
            vibrate: [300, 150, 300, 150, 300],
          } as any);
        })
        .catch(() => {
          try {
            const notification = new Notification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `vivaconnect-med-${med.id}-${scheduleTime}`,
              requireInteraction: true,
            });
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (e) {
            console.warn('Erro ao disparar notificação direta:', e);
          }
        });
    } else {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: `vivaconnect-med-${med.id}-${scheduleTime}`,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.warn('Erro ao disparar notificação do navegador:', err);
      }
    }
  }
}

/**
 * Send an immediate test notification to verify device notifications are working
 */
export async function testMedicationNotification(): Promise<{
  permissionGranted: boolean;
  message: string;
}> {
  const granted = await requestNotificationPermission();

  // Play audio chime and voice
  playReminderChime();
  speakText('Notificação de teste do VIVAConnect. Os avisos de remédio avisarão no horário com som e mensagem no seu aparelho.');

  if (granted && isNotificationSupported()) {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const title = '⏰ Teste de Lembrete: VIVAConnect';
    const body = `Notificações ativas no seu aparelho às ${nowTime}! Seus remédios avisarão pontualmente com som e alerta.`;

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'vivaconnect-test-notification',
            vibrate: [250, 100, 250],
            requireInteraction: true,
          } as any);
        })
        .catch(() => {
          try {
            new Notification(title, {
              body,
              icon: '/icon-192.png',
              requireInteraction: true,
            });
          } catch {}
        });
    } else {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          requireInteraction: true,
        });
      } catch (e) {
        console.warn('Erro ao enviar notificação de teste:', e);
      }
    }

    return {
      permissionGranted: true,
      message: 'Notificação enviada com sucesso! Seu aparelho está configurado para avisar no horário.',
    };
  }

  return {
    permissionGranted: false,
    message: 'Permissão de notificação não concedida no navegador. Ative as notificações para receber avisos.',
  };
}

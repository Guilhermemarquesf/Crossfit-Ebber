import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  MessagePayload,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging';
import { app, db } from './firebase';

export interface WorkoutReminderRecord {
  userId: string;
  userName: string;
  targetDate: string;
  trainingTime: string;
  fcmToken: string;
  enabled: boolean;
  wodReference: string;
  updatedAtIso: string;
  firestoreSynced: boolean;
}

export interface PushTokenRequestResult {
  permission: NotificationPermission | 'unsupported';
  token: string;
  status:
    | 'fcm-active'
    | 'local-only-missing-vapid'
    | 'permission-denied'
    | 'unsupported'
    | 'token-unavailable';
  message: string;
}

const REMINDER_STORAGE_PREFIX = 'cf_ebber_reminder_';

function getReminderStorageKey(userId: string): string {
  return `${REMINDER_STORAGE_PREFIX}${userId}`;
}

export function getTomorrowDateString(baseDate?: string): string {
  let base: Date;
  if (baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
    const [y, m, d] = baseDate.split('-').map(Number);
    base = new Date(y, m - 1, d);
  } else {
    base = new Date();
  }
  base.setDate(base.getDate() + 1);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readLocalReminder(userId: string): WorkoutReminderRecord | null {
  try {
    const raw = window.localStorage.getItem(getReminderStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as WorkoutReminderRecord;
  } catch {
    return null;
  }
}

function writeLocalReminder(record: WorkoutReminderRecord): void {
  try {
    window.localStorage.setItem(
      getReminderStorageKey(record.userId),
      JSON.stringify(record)
    );
  } catch {
    // Ignora caso storage esteja restrito
  }
}

async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      {
        scope: '/firebase-cloud-messaging-push-scope',
      }
    );
    return registration;
  } catch {
    return null;
  }
}

export async function requestPushReminderToken(): Promise<PushTokenRequestResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      permission: 'unsupported',
      token: '',
      status: 'unsupported',
      message:
        'Este navegador não suporta notificações push. Seu horário ficou salvo localmente.',
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = 'denied';
    }
  }

  if (permission !== 'granted') {
    return {
      permission,
      token: '',
      status: 'permission-denied',
      message:
        'Permissão de notificações bloqueada no navegador. Libere nas configurações do site para receber o push.',
    };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return {
      permission,
      token: '',
      status: 'unsupported',
      message:
        'Permissão concedida! Este ambiente não suporta PushManager remoto, mas lembretes locais estão ativos.',
    };
  }

  const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();
  const registration = await registerMessagingServiceWorker();

  if (!vapidKey) {
    return {
      permission,
      token: '',
      status: 'local-only-missing-vapid',
      message:
        'Permissão de notificação concedida! Para gerar token Web Push remoto do FCM, configure VITE_FIREBASE_VAPID_KEY.',
    };
  }

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    });

    if (token) {
      return {
        permission,
        token,
        status: 'fcm-active',
        message:
          'Notificação Push via Firebase Cloud Messaging ativada com sucesso!',
      };
    }

    return {
      permission,
      token: '',
      status: 'token-unavailable',
      message:
        'Permissão concedida, mas o navegador não retornou um token FCM neste contexto.',
    };
  } catch {
    return {
      permission,
      token: '',
      status: 'token-unavailable',
      message:
        'Permissão concedida! Não foi possível obter token FCM remoto neste ambiente (ex.: iframe ou chave VAPID).',
    };
  }
}

export async function saveWorkoutReminder(
  user: User,
  params: {
    userName: string;
    targetDate: string;
    trainingTime: string;
    fcmToken: string;
    wodReference: string;
  }
): Promise<WorkoutReminderRecord> {
  const baseRecord: WorkoutReminderRecord = {
    userId: user.uid,
    userName: params.userName.slice(0, 100),
    targetDate: params.targetDate,
    trainingTime: params.trainingTime.slice(0, 30),
    fcmToken: params.fcmToken.slice(0, 500),
    enabled: true,
    wodReference: params.wodReference.slice(0, 120),
    updatedAtIso: new Date().toISOString(),
    firestoreSynced: false,
  };

  const reminderRef = doc(db, 'reminders', user.uid);
  try {
    const existing = await getDoc(reminderRef);
    if (existing.exists()) {
      await updateDoc(reminderRef, {
        userName: baseRecord.userName,
        targetDate: baseRecord.targetDate,
        trainingTime: baseRecord.trainingTime,
        fcmToken: baseRecord.fcmToken,
        enabled: true,
        wodReference: baseRecord.wodReference,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(reminderRef, {
        userId: baseRecord.userId,
        userName: baseRecord.userName,
        targetDate: baseRecord.targetDate,
        trainingTime: baseRecord.trainingTime,
        fcmToken: baseRecord.fcmToken,
        enabled: true,
        wodReference: baseRecord.wodReference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    baseRecord.firestoreSynced = true;
  } catch {
    // Mantém funcionamento local se a regra de 'reminders' ainda não foi publicada no Firebase Console
    baseRecord.firestoreSynced = false;
  }

  writeLocalReminder(baseRecord);
  return baseRecord;
}

export async function cancelWorkoutReminder(
  user: User
): Promise<WorkoutReminderRecord | null> {
  const existing = readLocalReminder(user.uid);
  const cancelled: WorkoutReminderRecord = {
    userId: user.uid,
    userName: existing?.userName || user.displayName || 'Atleta Ebber',
    targetDate: existing?.targetDate || getTomorrowDateString(),
    trainingTime: existing?.trainingTime || '19:00',
    fcmToken: existing?.fcmToken || '',
    enabled: false,
    wodReference: existing?.wodReference || '',
    updatedAtIso: new Date().toISOString(),
    firestoreSynced: false,
  };

  try {
    const reminderRef = doc(db, 'reminders', user.uid);
    const snap = await getDoc(reminderRef);
    if (snap.exists()) {
      await updateDoc(reminderRef, {
        userName: cancelled.userName,
        targetDate: cancelled.targetDate,
        trainingTime: cancelled.trainingTime,
        fcmToken: cancelled.fcmToken,
        enabled: false,
        wodReference: cancelled.wodReference,
        updatedAt: serverTimestamp(),
      });
      cancelled.firestoreSynced = true;
    }
  } catch {
    cancelled.firestoreSynced = false;
  }

  writeLocalReminder(cancelled);
  return cancelled;
}

export async function loadWorkoutReminder(
  userId: string
): Promise<WorkoutReminderRecord | null> {
  const local = readLocalReminder(userId);
  try {
    const snap = await getDoc(doc(db, 'reminders', userId));
    if (snap.exists()) {
      const d = snap.data();
      const synced: WorkoutReminderRecord = {
        userId: String(d.userId || userId),
        userName: String(d.userName || 'Atleta Ebber'),
        targetDate: String(d.targetDate || getTomorrowDateString()),
        trainingTime: String(d.trainingTime || '19:00'),
        fcmToken: String(d.fcmToken || ''),
        enabled: Boolean(d.enabled),
        wodReference: String(d.wodReference || ''),
        updatedAtIso: new Date().toISOString(),
        firestoreSynced: true,
      };
      writeLocalReminder(synced);
      return synced;
    }
  } catch {
    // Retorna dados locais se Firestore não estiver liberado para reminders
  }
  return local;
}

export async function subscribeForegroundMessages(
  onReceive: (payload: MessagePayload) => void
): Promise<() => void> {
  try {
    const supported = await isSupported();
    if (!supported) return () => {};
    const messaging = getMessaging(app);
    return onMessage(messaging, onReceive);
  } catch {
    return () => {};
  }
}

export async function sendTestWorkoutNotification(
  trainingTime: string,
  targetDateFormatted: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const title = 'Crossfit Ebber · Lembrete Confirmado!';
  const body = `Seu treino de amanhã (${targetDateFormatted}) às ${trainingTime} está agendado. Não deixe o foguinho apagar!`;

  try {
    const reg = await registerMessagingServiceWorker();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'crossfit-ebber-test-reminder',
      });
      return true;
    }
  } catch {
    // Fallback para Notification API direta
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
    });
    return true;
  } catch {
    return false;
  }
}

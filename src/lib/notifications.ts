import { addDoc, collection, Firestore } from 'firebase/firestore';
import { Notification } from '../types';

export type NotificationInput = {
  userId?: string | null;
  title: string;
  message: string;
  type?: Notification['type'];
  read?: boolean;
  channel?: Notification['channel'];
  status?: Notification['status'];
  createdAt?: string;
};

const notificationTypes: Notification['type'][] = ['info', 'warning', 'success', 'error'];
const notificationChannels: Notification['channel'][] = ['internal', 'whatsapp', 'sms', 'email'];
const notificationStatuses: Notification['status'][] = ['pending', 'sent', 'failed'];

function pickAllowed<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function asIsoString(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

export function buildNotification(input: NotificationInput): Omit<Notification, 'id'> {
  return {
    userId: input.userId || '',
    title: input.title,
    message: input.message,
    type: input.type || 'info',
    read: input.read ?? false,
    channel: input.channel || 'internal',
    status: input.status || 'pending',
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function normalizeNotification(id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    title: typeof data.title === 'string' ? data.title : 'Notification',
    message: typeof data.message === 'string' ? data.message : '',
    type: pickAllowed(data.type, notificationTypes, 'info'),
    read: typeof data.read === 'boolean' ? data.read : false,
    channel: pickAllowed(data.channel, notificationChannels, 'internal'),
    status: pickAllowed(data.status, notificationStatuses, 'pending'),
    createdAt: asIsoString(data.createdAt),
  };
}

export async function createNotification(db: Firestore, input: NotificationInput) {
  return addDoc(collection(db, 'notifications'), buildNotification(input));
}

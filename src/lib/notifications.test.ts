import { describe, expect, it } from 'vitest';
import { buildNotification, normalizeNotification } from './notifications';

describe('notification helpers', () => {
  it('creates internal pending notifications with sane defaults', () => {
    const notification = buildNotification({
      userId: 'user-1',
      title: 'Payment Reminder',
      message: 'Your balance is due.',
      type: 'warning',
      createdAt: '2026-05-16T10:00:00.000Z',
    });

    expect(notification).toEqual({
      userId: 'user-1',
      title: 'Payment Reminder',
      message: 'Your balance is due.',
      type: 'warning',
      read: false,
      channel: 'internal',
      status: 'pending',
      createdAt: '2026-05-16T10:00:00.000Z',
    });
  });

  it('normalizes legacy notification documents for display', () => {
    const notification = normalizeNotification('notif-1', {
      userId: 'user-1',
      title: 'Legacy Alert',
      message: 'Created before the notification schema was strict.',
      type: 'unknown',
      createdAt: '2026-05-16T10:00:00.000Z',
    });

    expect(notification).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      title: 'Legacy Alert',
      message: 'Created before the notification schema was strict.',
      type: 'info',
      read: false,
      channel: 'internal',
      status: 'pending',
      createdAt: '2026-05-16T10:00:00.000Z',
    });
  });
});

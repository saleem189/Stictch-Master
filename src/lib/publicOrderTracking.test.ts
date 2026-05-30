import { describe, expect, it } from 'vitest';
import { Order } from '../types';
import { buildPublicOrderTracking, normalizePublicOrderTracking } from './publicOrderTracking';

const baseOrder: Order = {
  id: 'order_public_123',
  clientId: 'client-secret',
  clientName: 'Private Client',
  clientPhone: '03001234567',
  branchId: 'branch-1',
  items: [
    {
      id: 'item-1',
      type: 'Sherwani',
      description: 'Private notes',
      price: 50000,
      measurements: { chest: 40 },
      status: 'stitching',
      dueDate: '2026-06-20',
    },
  ],
  status: 'in-progress',
  totalAmount: 50000,
  paidAmount: 10000,
  dueDate: '2026-06-20',
  createdAt: '2026-05-30T00:00:00.000Z',
  updatedAt: '2026-05-30T00:00:00.000Z',
  auditTrail: [],
  taskStatus: {
    cutting: 'completed',
    stitching: 'in-progress',
    finishing: 'pending',
  },
};

describe('public order tracking', () => {
  it('builds a sanitized public tracking document without private client or financial fields', () => {
    const tracking = buildPublicOrderTracking(baseOrder, '2026-05-30T12:00:00.000Z');

    expect(tracking).toEqual({
      trackingCode: 'order_public_123',
      status: 'in-progress',
      dueDate: '2026-06-20',
      itemCount: 1,
      updatedAt: '2026-05-30T12:00:00.000Z',
      steps: {
        registered: true,
        cutting: true,
        stitching: false,
        finishing: false,
        ready: false,
      },
    });

    expect(JSON.stringify(tracking)).not.toContain('Private Client');
    expect(JSON.stringify(tracking)).not.toContain('03001234567');
    expect(JSON.stringify(tracking)).not.toContain('50000');
    expect(JSON.stringify(tracking)).not.toContain('Private notes');
  });

  it('marks public tracking ready when the order is ready or delivered', () => {
    const tracking = buildPublicOrderTracking({
      ...baseOrder,
      status: 'ready',
      taskStatus: {
        cutting: 'completed',
        stitching: 'completed',
        finishing: 'completed',
      },
    });

    expect(tracking.steps).toEqual({
      registered: true,
      cutting: true,
      stitching: true,
      finishing: true,
      ready: true,
    });
  });

  it('normalizes legacy public tracking documents for display', () => {
    expect(normalizePublicOrderTracking('track-1', {
      status: 'unknown',
      itemCount: -5,
      steps: { registered: true, cutting: true },
    })).toEqual({
      trackingCode: 'track-1',
      status: 'pending',
      dueDate: '',
      itemCount: 0,
      updatedAt: '',
      steps: {
        registered: true,
        cutting: true,
        stitching: false,
        finishing: false,
        ready: false,
      },
    });
  });
});

import { Order, OrderStatus, PublicOrderTracking, Task } from '../types';

const orderStatuses: OrderStatus[] = ['pending', 'in-progress', 'ready', 'delivered', 'cancelled'];

export function buildPublicOrderTracking(order: Order, updatedAt = new Date().toISOString()): PublicOrderTracking {
  return {
    trackingCode: order.id,
    status: order.status,
    dueDate: order.dueDate || '',
    itemCount: Array.isArray(order.items) ? order.items.length : 0,
    updatedAt,
    steps: {
      registered: true,
      cutting: isTaskComplete(order.taskStatus?.cutting),
      stitching: isTaskComplete(order.taskStatus?.stitching),
      finishing: isTaskComplete(order.taskStatus?.finishing),
      ready: order.status === 'ready' || order.status === 'delivered',
    },
  };
}

export function normalizePublicOrderTracking(id: string, data: Record<string, unknown>): PublicOrderTracking {
  const steps = isRecord(data.steps) ? data.steps : {};

  return {
    trackingCode: typeof data.trackingCode === 'string' && data.trackingCode.trim() ? data.trackingCode : id,
    status: isOrderStatus(data.status) ? data.status : 'pending',
    dueDate: typeof data.dueDate === 'string' ? data.dueDate : '',
    itemCount: typeof data.itemCount === 'number' && data.itemCount > 0 ? data.itemCount : 0,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
    steps: {
      registered: typeof steps.registered === 'boolean' ? steps.registered : false,
      cutting: typeof steps.cutting === 'boolean' ? steps.cutting : false,
      stitching: typeof steps.stitching === 'boolean' ? steps.stitching : false,
      finishing: typeof steps.finishing === 'boolean' ? steps.finishing : false,
      ready: typeof steps.ready === 'boolean' ? steps.ready : false,
    },
  };
}

function isTaskComplete(status?: Task['status']): boolean {
  return status === 'completed';
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && orderStatuses.includes(value as OrderStatus);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

import { describe, expect, it } from 'vitest';
import { buildSeedData, SEED_IDS } from './seedData';

describe('seed data builder', () => {
  it('creates role profiles for admin, employees, and clients', () => {
    const seed = buildSeedData('2026-05-17T00:00:00.000Z');

    expect(seed.users.map(user => user.role).sort()).toEqual(['admin', 'client', 'client', 'employee', 'employee']);
    expect(seed.users.find(user => user.uid === SEED_IDS.adminUser)?.permissions.canManageSystemSettings).toBe(true);
    expect(seed.users.filter(user => user.role === 'employee').every(user => Boolean(user.employeeId))).toBe(true);
    expect(seed.users.filter(user => user.role === 'client').every(user => user.clientId === user.uid)).toBe(true);
  });

  it('links client documents, orders, quotes, appointments, and notifications to auth-scoped client ids', () => {
    const seed = buildSeedData('2026-05-17T00:00:00.000Z');
    const clientIds = new Set(seed.clients.map(client => client.id));

    expect(clientIds.has(SEED_IDS.clientUserA)).toBe(true);
    expect(clientIds.has(SEED_IDS.clientUserB)).toBe(true);
    expect(seed.orders.every(order => clientIds.has(order.clientId))).toBe(true);
    expect(seed.quoteRequests.every(request => clientIds.has(request.clientId))).toBe(true);
    expect(seed.appointments.every(appointment => clientIds.has(appointment.clientId))).toBe(true);
    expect(seed.notifications.every(notification => seed.users.some(user => user.uid === notification.userId))).toBe(true);
  });

  it('uses seeded chart-of-account ids in transactions and recurring transactions', () => {
    const seed = buildSeedData('2026-05-17T00:00:00.000Z');
    const accountIds = new Set(seed.accounts.map(account => account.id));

    expect(seed.transactions.every(transaction => accountIds.has(transaction.debitAccountId))).toBe(true);
    expect(seed.transactions.every(transaction => accountIds.has(transaction.creditAccountId))).toBe(true);
    expect(seed.recurringTransactions.every(transaction => accountIds.has(transaction.debitAccountId))).toBe(true);
    expect(seed.recurringTransactions.every(transaction => accountIds.has(transaction.creditAccountId))).toBe(true);
  });

  it('assigns production tasks to seeded employees and orders', () => {
    const seed = buildSeedData('2026-05-17T00:00:00.000Z');
    const employeeIds = new Set(seed.employees.map(employee => employee.id));
    const orderIds = new Set(seed.orders.map(order => order.id));

    expect(seed.tasks.length).toBeGreaterThan(0);
    expect(seed.tasks.every(task => employeeIds.has(task.employeeId))).toBe(true);
    expect(seed.tasks.every(task => orderIds.has(task.orderId))).toBe(true);
  });
});

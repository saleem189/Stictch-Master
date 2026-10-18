import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

const projectId = 'demo-stitchmaster';
let testEnv: RulesTestEnvironment;

const safePermissions = {
  canEditMeasurements: false,
  canApprovePayroll: false,
  canProcessPayments: false,
  canAdjustInventory: false,
  canDeleteOrders: false,
  canViewFinancialReports: false,
  canManageEmployees: false,
  canManageSystemSettings: false,
  canManageInventory: false,
  canManageClients: false,
  canManageAccounting: false,
  canManageOrders: false,
};

beforeAll(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8080, rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore security rules', () => {
  it('allows self-signup as a client but denies self-promotion to admin', async () => {
    const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' }).firestore();
    await assertSucceeds(setDoc(doc(alice, 'users/alice'), {
      uid: 'alice', email: 'alice@example.com', role: 'client', permissions: safePermissions,
    }));
    await assertFails(setDoc(doc(alice, 'users/alice'), {
      uid: 'alice', email: 'alice@example.com', role: 'admin', permissions: safePermissions,
    }));
  });

  it('allows clients to create their own quote and denies cross-client requests or status changes', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const quote = {
      clientId: 'alice', garmentType: 'Jacket', styleNotes: 'Navy wool',
      preferredDueDate: '2026-12-01', budgetRange: '100-200',
      measurementSource: 'existing', status: 'submitted',
    };

    await assertSucceeds(setDoc(doc(alice, 'quoteRequests/alice-quote'), quote));
    await assertFails(setDoc(doc(alice, 'quoteRequests/other-quote'), { ...quote, clientId: 'bob' }));
    await assertFails(updateDoc(doc(alice, 'quoteRequests/alice-quote'), { status: 'converted' }));
  });

  it('limits client order reads and queries to the signed-in uid', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'orders/alice-order'), { clientId: 'alice' });
      await setDoc(doc(db, 'orders/bob-order'), { clientId: 'bob' });
    });

    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'orders/alice-order')));
    await assertFails(getDoc(doc(alice, 'orders/bob-order')));
    await assertSucceeds(getDocs(query(collection(alice, 'orders'), where('clientId', '==', 'alice'))));
    await assertFails(getDocs(collection(alice, 'orders')));
  });

  it('restricts payroll creation to admins', async () => {
    const employee = testEnv.authenticatedContext('employee').firestore();
    const admin = testEnv.authenticatedContext('admin').firestore();
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      await setDoc(doc(db, 'users/admin'), { uid: 'admin', role: 'admin' });
      await setDoc(doc(db, 'users/employee'), { uid: 'employee', role: 'employee' });
    });

    const payrollRecord = { employeeId: 'employee-1', month: '2026-10', status: 'paid' };
    await assertFails(setDoc(doc(employee, 'payrollRecords/employee-1'), payrollRecord));
    await assertSucceeds(setDoc(doc(admin, 'payrollRecords/employee-1'), payrollRecord));
  });

  it('allows public gets of sanitized tracking records but denies listing them', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'publicOrderTracking/public-code'), {
        trackingCode: 'public-code', status: 'in-progress', dueDate: '2026-12-01',
        itemCount: 1, updatedAt: '2026-10-18T00:00:00.000Z',
        steps: { registered: true, cutting: false, stitching: false, finishing: false, ready: false },
      });
    });

    const publicDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(publicDb, 'publicOrderTracking/public-code')));
    await assertFails(getDocs(collection(publicDb, 'publicOrderTracking')));
  });

  it('prevents a user from creating a notification for another user', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const notification = {
      title: 'Update', message: 'Your order changed', type: 'info', read: false,
      channel: 'internal', status: 'pending', createdAt: '2026-10-18T00:00:00.000Z',
    };
    await assertSucceeds(setDoc(doc(alice, 'notifications/alice-note'), { ...notification, userId: 'alice' }));
    await assertFails(setDoc(doc(alice, 'notifications/bob-note'), { ...notification, userId: 'bob' }));
  });
});

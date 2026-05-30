import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { buildSeedData, SeedData } from './seedData';

type SeedCollectionName =
  | 'users'
  | 'branches'
  | 'employees'
  | 'clients'
  | 'inventory'
  | 'vendors'
  | 'vendorBills'
  | 'accounts'
  | 'orders'
  | 'tasks'
  | 'appointments'
  | 'quoteRequests'
  | 'transactions'
  | 'financialDocuments'
  | 'recurringTransactions'
  | 'notifications';

interface SeedRecord {
  id: string;
}

const COLLECTIONS: { name: SeedCollectionName; records: (seed: SeedData) => SeedRecord[] }[] = [
  { name: 'users', records: seed => seed.users.map(user => ({ id: user.uid, ...user })) },
  { name: 'branches', records: seed => seed.branches as SeedRecord[] },
  { name: 'employees', records: seed => seed.employees as SeedRecord[] },
  { name: 'clients', records: seed => seed.clients as SeedRecord[] },
  { name: 'inventory', records: seed => seed.inventory as SeedRecord[] },
  { name: 'vendors', records: seed => seed.vendors as SeedRecord[] },
  { name: 'vendorBills', records: seed => seed.vendorBills as SeedRecord[] },
  { name: 'accounts', records: seed => seed.accounts as SeedRecord[] },
  { name: 'orders', records: seed => seed.orders as SeedRecord[] },
  { name: 'tasks', records: seed => seed.tasks as SeedRecord[] },
  { name: 'appointments', records: seed => seed.appointments as SeedRecord[] },
  { name: 'quoteRequests', records: seed => seed.quoteRequests as SeedRecord[] },
  { name: 'transactions', records: seed => seed.transactions as SeedRecord[] },
  { name: 'financialDocuments', records: seed => seed.financialDocuments as SeedRecord[] },
  { name: 'recurringTransactions', records: seed => seed.recurringTransactions as SeedRecord[] },
  { name: 'notifications', records: seed => seed.notifications as SeedRecord[] },
];

function stripId(record: SeedRecord) {
  const data = { ...record } as Record<string, unknown>;
  delete data.id;
  return data;
}

export async function seedDatabase(nowIso = new Date().toISOString()) {
  const seed = buildSeedData(nowIso);
  let writeCount = 0;

  try {
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const collectionSpec of COLLECTIONS) {
      for (const record of collectionSpec.records(seed)) {
        batch.set(doc(db, collectionSpec.name, record.id), {
          ...stripId(record),
          seededAt: serverTimestamp(),
        }, { merge: true });

        writeCount += 1;
        batchCount += 1;

        if (batchCount === 450) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.info(`Seeded ${writeCount} Tailoring ERP records.`);
    return {
      ok: true,
      writeCount,
      users: seed.users.length,
      clients: seed.clients.length,
      employees: seed.employees.length,
      orders: seed.orders.length,
    };
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

export async function promoteCurrentUserToSeedAdmin(uid: string, email: string) {
  await setDoc(doc(db, 'users', uid), {
    ...buildSeedData().users[0],
    uid,
    email,
    seededAt: serverTimestamp(),
  }, { merge: true });
}

import { buildSeedData, SEED_IDS } from '../src/lib/seedData.ts';

const projectId = 'demo-stitchmaster';
const authBaseUrl = 'http://127.0.0.1:9099';
const firestoreBaseUrl = 'http://127.0.0.1:8080';
const demoAdmin = { email: 'demo.admin@tailoringerp.test', password: 'TailorDemo!2026', name: 'Demo Admin' };
const demoClient = { email: 'demo.client@tailoringerp.test', password: 'TailorClient!2026', name: 'Demo Client' };
const fakeApiKey = 'fake-api-key';

type JsonObject = Record<string, unknown>;
type FirestoreValue = Record<string, unknown>;

function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = Object.fromEntries(
      Object.entries(value as JsonObject)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([key, fieldValue]) => [key, encodeFirestoreValue(fieldValue)])
    );
    return { mapValue: { fields } };
  }

  throw new Error(`Unsupported demo value type: ${typeof value}`);
}

function replaceSeedId(value: unknown, originalId: string, replacementId: string): unknown {
  if (value === originalId) return replacementId;
  if (Array.isArray(value)) return value.map(item => replaceSeedId(item, originalId, replacementId));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as JsonObject).map(([key, child]) => [key, replaceSeedId(child, originalId, replacementId)])
    );
  }
  return value;
}

async function parseResponse(response: Response, context: string) {
  const body = await response.json().catch(() => ({})) as JsonObject;
  if (!response.ok) {
    const nestedError = body.error as JsonObject | undefined;
    const message = typeof nestedError?.message === 'string' ? nestedError.message : `HTTP ${response.status}`;
    throw new Error(`${context}: ${message}`);
  }
  return body;
}

async function getOrCreateDemoAccount(email: string, password: string, name: string) {
  const signupUrl = `${authBaseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${fakeApiKey}`;
  const signup = await fetch(signupUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: name, returnSecureToken: true }),
  });

  if (signup.ok) return parseResponse(signup, 'Could not create the local demo account');

  const signInUrl = `${authBaseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fakeApiKey}`;
  const signIn = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  return parseResponse(signIn, 'Could not sign in to the local demo account');
}

async function writeDemoDocument(collection: string, id: string, record: JsonObject) {
  const documentPath = `projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`;
  const url = `${firestoreBaseUrl}/v1/${documentPath}`;
  const fields = Object.fromEntries(
    Object.entries({ ...record, seededAt: new Date().toISOString() })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, encodeFirestoreValue(value)])
  );
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer owner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  await parseResponse(response, `Could not seed ${collection}/${id}`);
}

async function main() {
  const authConfig = await fetch(`${authBaseUrl}/emulator/v1/projects/${projectId}/config`);
  if (!authConfig.ok) throw new Error('Auth emulator is not available at 127.0.0.1:9099. Start it with npm run emulators.');
  const firestoreHealth = await fetch(firestoreBaseUrl);
  if (!firestoreHealth.ok && firestoreHealth.status >= 500) {
    throw new Error('Firestore emulator is not available at 127.0.0.1:8080. Start it with npm run emulators.');
  }

  const [adminAccount, clientAccount] = await Promise.all([
    getOrCreateDemoAccount(demoAdmin.email, demoAdmin.password, demoAdmin.name),
    getOrCreateDemoAccount(demoClient.email, demoClient.password, demoClient.name),
  ]);
  if (typeof adminAccount.localId !== 'string' || typeof clientAccount.localId !== 'string') {
    throw new Error('The Auth emulator did not return demo user IDs.');
  }
  const adminUid = adminAccount.localId;
  const clientUid = clientAccount.localId;
  const demoData = replaceSeedId(
    replaceSeedId(buildSeedData(), SEED_IDS.adminUser, adminUid),
    SEED_IDS.clientUserA,
    clientUid
  ) as ReturnType<typeof buildSeedData>;
  const asJsonRecords = (records: object[]) => records as unknown as JsonObject[];
  const recordsByCollection: Array<[string, JsonObject[]]> = [
    ['users', demoData.users.map(profile => ({ ...profile, uid: profile.uid, id: profile.uid }))],
    ['branches', asJsonRecords(demoData.branches)],
    ['employees', asJsonRecords(demoData.employees)],
    ['clients', asJsonRecords(demoData.clients)],
    ['inventory', asJsonRecords(demoData.inventory)],
    ['vendors', asJsonRecords(demoData.vendors)],
    ['vendorBills', asJsonRecords(demoData.vendorBills)],
    ['accounts', asJsonRecords(demoData.accounts)],
    ['orders', asJsonRecords(demoData.orders)],
    ['tasks', asJsonRecords(demoData.tasks)],
    ['appointments', asJsonRecords(demoData.appointments)],
    ['quoteRequests', asJsonRecords(demoData.quoteRequests)],
    ['transactions', asJsonRecords(demoData.transactions)],
    ['financialDocuments', asJsonRecords(demoData.financialDocuments)],
    ['recurringTransactions', asJsonRecords(demoData.recurringTransactions)],
    ['notifications', asJsonRecords(demoData.notifications)],
  ];

  for (const [collection, records] of recordsByCollection) {
    const chunks: JsonObject[][] = [];
    for (let index = 0; index < records.length; index += 20) chunks.push(records.slice(index, index + 20) as JsonObject[]);
    for (const chunk of chunks) {
      await Promise.all(chunk.map(record => {
        const id = String(record.id ?? record.uid);
        const data = { ...record };
        delete data.id;
        const isDemoAdmin = collection === 'users' && id === adminUid;
        const isDemoClientProfile = collection === 'users' && id === clientUid;
        const isDemoClientRecord = collection === 'clients' && id === clientUid;
        const docData = isDemoAdmin
          ? { ...data, uid: adminUid, email: demoAdmin.email, name: demoAdmin.name }
          : isDemoClientProfile
            ? { ...data, uid: clientUid, clientId: clientUid, email: demoClient.email, name: demoClient.name }
            : isDemoClientRecord
              ? { ...data, email: demoClient.email, name: demoClient.name }
              : data;
        return writeDemoDocument(collection, id, docData);
      }));
    }
  }

  console.log(`Seeded ${recordsByCollection.reduce((total, [, records]) => total + records.length, 0)} synthetic demo records into ${projectId}.`);
  console.log(`Admin email: ${demoAdmin.email}`);
  console.log(`Admin password: ${demoAdmin.password}`);
  console.log(`Client email: ${demoClient.email}`);
  console.log(`Client password: ${demoClient.password}`);
  console.log('These credentials are local-only and are accepted by the Firebase Auth emulator only.');
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Demo data setup failed.');
  process.exitCode = 1;
});

import { Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

export type OfflinePersistenceResult =
  | { enabled: true }
  | { enabled: false; reason: 'multiple-tabs' | 'unsupported-browser' | 'unknown'; error?: unknown };

type PersistenceEnabler = typeof enableMultiTabIndexedDbPersistence;

export async function enableOfflinePersistence(
  db: Firestore,
  enable: PersistenceEnabler = enableMultiTabIndexedDbPersistence
): Promise<OfflinePersistenceResult> {
  try {
    await enable(db);
    return { enabled: true };
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;

    if (code === 'failed-precondition') {
      return { enabled: false, reason: 'multiple-tabs' };
    }

    if (code === 'unimplemented') {
      return { enabled: false, reason: 'unsupported-browser' };
    }

    return { enabled: false, reason: 'unknown', error };
  }
}

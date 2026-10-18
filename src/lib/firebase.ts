import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import configuredFirebaseConfig from '../../firebase-applet-config.json';
import { enableOfflinePersistence } from './offlinePersistence';

const firebaseConfig = import.meta.env.VITE_FIREBASE_PROJECT_ID
  ? { ...configuredFirebaseConfig, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID }
  : configuredFirebaseConfig;
const useFirebaseEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, useFirebaseEmulator ? '(default)' : firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

if (useFirebaseEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

void enableOfflinePersistence(db).then(result => {
  if (result.enabled === true) {
    console.info('Firestore offline persistence enabled.');
    return;
  }

  const disabledResult = result;

  if (disabledResult.reason === 'multiple-tabs') {
    console.info('Firestore offline persistence is owned by another open tab.');
    return;
  }

  if (disabledResult.reason === 'unsupported-browser') {
    console.info('Firestore offline persistence is not supported in this browser.');
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

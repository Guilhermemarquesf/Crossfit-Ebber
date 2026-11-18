import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  setLogLevel,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC8jLI7hvrcsGNCgmDyjUv695H8y0k_OHQ',
  authDomain: 'crossfitebber.firebaseapp.com',
  projectId: 'crossfitebber',
  storageBucket: 'crossfitebber.firebasestorage.app',
  messagingSenderId: '364035435385',
  appId: '1:364035435385:web:b06299ccc9b8c3e9351da8',
  measurementId: 'G-DY5EJ2LSTB',
};

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function createFirestoreInstance(): Firestore {
  setLogLevel('silent');
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestoreInstance();

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  if (
    !errInfo.error.includes('offline') &&
    !errInfo.error.includes('unavailable')
  ) {
    console.warn('Firestore notice:', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

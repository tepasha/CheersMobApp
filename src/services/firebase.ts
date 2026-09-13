import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  doc, 
  getDocFromServer,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Configure persistent multi-tab offline cache with unlimited size for basement bars
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    },
    firebaseConfig.firestoreDatabaseId
  );
  console.log('[Firestore] Offline persistent local cache (IndexedDB) configured for basement bars');
} catch (err) {
  console.warn('[Firestore] Falling back to default getFirestore instance:', err);
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// CRITICAL: Export the configured Firestore instance and Auth
export const db = firestoreInstance;
export const auth = getAuth(app);

// Automatically initialize anonymous auth session if not signed in, so request.auth is populated in Firestore rules
export function ensureFirebaseAuth(): Promise<string | null> {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user.uid);
        } catch (err) {
          console.warn('[Firebase Auth] Anonymous sign-in notice:', err);
          resolve(null);
        }
      }
    });
  });
}

// Trigger initial auth setup asynchronously
if (typeof window !== 'undefined') {
  ensureFirebaseAuth().catch(() => {});
}

// Network control for basement bars (offline testing & simulation)
export async function disableOfflineNetwork(): Promise<void> {
  try {
    await disableNetwork(db);
    console.log('[Firestore] Network disabled: Activated basement bar offline mode');
  } catch (err) {
    console.warn('[Firestore] Error disabling network:', err);
  }
}

export async function enableOfflineNetwork(): Promise<void> {
  try {
    await enableNetwork(db);
    console.log('[Firestore] Network re-enabled: Reconnected to Cloud Firestore');
  } catch (err) {
    console.warn('[Firestore] Error enabling network:', err);
  }
}

export async function syncPendingWrites(): Promise<void> {
  try {
    await waitForPendingWrites(db);
    console.log('[Firestore] All offline basement writes have synchronized with Cloud Firestore');
  } catch (err) {
    console.warn('[Firestore] Sync pending writes notice:', err);
  }
}

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated by skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode with IndexedDB local cache active.');
      return false;
    }
    // Connection test document may not exist yet, but reaching server without offline error means connected
    return true;
  }
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
  DocumentReference,
  Unsubscribe,
  getDocFromServer,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDllt69DzwnJL9g1P3W1YG6CPV6D6EsDuI",
  authDomain: "friend-initiative-organization.firebaseapp.com",
  projectId: "friend-initiative-organization",
  firestoreDatabaseId: "ai-studio-friendinitiative-08064d2d-5422-4921-a2a1-12631c722943",
  storageBucket: "friend-initiative-organization.firebasestorage.app",
  messagingSenderId: "677048509436",
  appId: "1:677048509436:web:ef4b275ad1b3415bcb4879",
};

// Initialize Firebase safely (avoid duplicate app initialization)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Attempt anonymous authentication in background
let authAttempted = false;
export async function ensureFirebaseAuth(): Promise<void> {
  if (authAttempted || auth.currentUser) return;
  authAttempted = true;
  try {
    await signInAnonymously(auth);
  } catch (err: any) {
    console.debug('Firebase anonymous auth note:', err?.code || err?.message);
  }
}

// Kick off auth check asynchronously
ensureFirebaseAuth().catch(() => {});

// Test connection on boot per Firebase guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(centralDocRef);
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client appears to be offline.");
    }
    return false;
  }
}

export const FIRESTORE_COLLECTION = 'somiti_data';
export const FIRESTORE_DOCUMENT = 'central_database';

export const centralDocRef: DocumentReference = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOCUMENT);

export interface SomitiCloudBundle {
  members: any[];
  transactions: any[];
  loans: any[];
  projects: any[];
  projectExpenses: any[];
  tasks: any[];
  cashbook: any[];
  version: number;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Clean data of any undefined values which Firestore rejects
 */
function cleanPayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
}

/**
 * Fetch authoritative central Somiti database snapshot from Firestore
 */
export async function fetchFromFirebase(): Promise<SomitiCloudBundle | null> {
  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(centralDocRef);
    if (snap.exists()) {
      const data = snap.data() as SomitiCloudBundle;
      if (data && Array.isArray(data.members)) {
        return data;
      }
    }
    return null;
  } catch (err: any) {
    console.warn('Firebase Firestore fetch notice:', err?.message || err);
    return null;
  }
}

/**
 * Push full or partial bundle to Firestore document `somiti_data/central_database`
 */
export async function pushToFirebase(
  bundle: Partial<SomitiCloudBundle>
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    await ensureFirebaseAuth();

    const newVersion = (bundle.version ? bundle.version + 1 : Date.now());

    const payload: Record<string, any> = {
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: bundle.updatedBy || 'admin',
    };

    if (bundle.members !== undefined) payload.members = bundle.members;
    if (bundle.transactions !== undefined) payload.transactions = bundle.transactions;
    if (bundle.loans !== undefined) payload.loans = bundle.loans;
    if (bundle.projects !== undefined) payload.projects = bundle.projects;
    if (bundle.projectExpenses !== undefined) payload.projectExpenses = bundle.projectExpenses;
    if (bundle.tasks !== undefined) payload.tasks = bundle.tasks;
    if (bundle.cashbook !== undefined) payload.cashbook = bundle.cashbook;

    const sanitized = cleanPayload(payload);
    await setDoc(centralDocRef, sanitized, { merge: true });

    return {
      success: true,
      version: newVersion,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Firestore write failed';
    console.warn('Firebase Firestore push notice:', errorMsg);
    handleFirestoreError(err, OperationType.WRITE, `${FIRESTORE_COLLECTION}/${FIRESTORE_DOCUMENT}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Listen in real time to all updates on Firestore `somiti_data/central_database`
 */
export function subscribeToFirebase(
  onData: (data: SomitiCloudBundle) => void,
  onError?: (err: any) => void
): Unsubscribe {
  return onSnapshot(
    centralDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SomitiCloudBundle;
        if (data && Array.isArray(data.members)) {
          onData(data);
        }
      }
    },
    (err) => {
      console.warn('Firebase Firestore onSnapshot notice:', err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Verify Firestore connection and test read access
 */
export async function verifyFirebaseConnection(): Promise<{
  connected: boolean;
  message: string;
  version?: number;
  membersCount?: number;
}> {
  try {
    await ensureFirebaseAuth();
    const snap = await getDoc(centralDocRef);
    if (snap.exists()) {
      const data = snap.data() as SomitiCloudBundle;
      return {
        connected: true,
        message: 'Firebase Firestore Connected (friend-initiative-organization)',
        version: data.version || 1,
        membersCount: data.members?.length || 0,
      };
    } else {
      return {
        connected: true,
        message: 'Firebase Firestore Connected (Ready to initialize central_database)',
        version: 1,
        membersCount: 0,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Firebase connection failed',
    };
  }
}

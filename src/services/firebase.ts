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
  runTransaction,
  serverTimestamp,
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

export interface EditKistiTransactionParams {
  transactionId: string;
  memberId: string;
  oldKistiAmount: number;
  newKistiAmount: number;
  oldFineAmount: number;
  newFineAmount: number;
  newDate: string;
  newTargetMonth: string;
  correctionReason?: string;
  editorName?: string;
}

/**
 * Safely edit a kisti transaction using Firebase runTransaction:
 * - Recalculates difference for member total_deposited & total_fine_paid
 * - Updates global stats: total_deposit, total_fine, cash_in_hand, total_asset, per_share_value
 * - Updates member current_equity_value based on 100 shares model
 * - Atomically syncs the central somiti_data/central_database document and standalone collections
 */
export const handleEditKistiTransaction = async ({
  transactionId,
  memberId,
  oldKistiAmount,
  newKistiAmount,
  oldFineAmount,
  newFineAmount,
  newDate,
  newTargetMonth,
  correctionReason = '',
  editorName = 'Cashier',
}: EditKistiTransactionParams): Promise<{ success: boolean; error?: string }> => {
  try {
    await ensureFirebaseAuth();
    const globalRef = doc(db, 'samity_summary', 'global_stats');
    const memberRef = doc(db, 'members', memberId);
    const txRef = doc(db, 'transactions', transactionId);

    // Difference calculations
    const kistiDiff = Number(newKistiAmount) - Number(oldKistiAmount);
    const fineDiff = Number(newFineAmount) - Number(oldFineAmount);
    const totalCashDiff = kistiDiff + fineDiff;
    const newTotalPaid = Number(newKistiAmount) + Number(newFineAmount);

    await runTransaction(db, async (transaction) => {
      const centralSnap = await transaction.get(centralDocRef);
      const globalDoc = await transaction.get(globalRef);
      const memberDoc = await transaction.get(memberRef);

      const gData = globalDoc.exists() ? (globalDoc.data() || {}) : {};
      const mData = memberDoc.exists() ? (memberDoc.data() || {}) : {};

      // 1. Global Stats update
      const updatedTotalDeposit = Math.max(0, (Number(gData.total_deposit) || 0) + kistiDiff);
      const updatedTotalFine = Math.max(0, (Number(gData.total_fine) || 0) + fineDiff);
      const updatedCashInHand = Math.max(0, (Number(gData.cash_in_hand) || 0) + totalCashDiff);
      const updatedTotalAsset = updatedTotalDeposit + (Number(gData.total_profit) || 0) + updatedTotalFine;
      const updatedPerShareValue = updatedTotalAsset / 100;

      // 2. Member Stats update
      const updatedMemberDeposit = Math.max(0, (Number(mData.total_deposited) || 0) + kistiDiff);
      const updatedMemberFine = Math.max(0, (Number(mData.total_fine_paid) || 0) + fineDiff);
      const totalMembers = Number(gData.total_members) || 8;
      const memberShares = 100 / (totalMembers || 1);
      const updatedMemberEquity = memberShares * updatedPerShareValue;

      // 1. Update Global Stats Doc in Firestore
      transaction.set(globalRef, {
        total_deposit: updatedTotalDeposit,
        total_fine: updatedTotalFine,
        cash_in_hand: updatedCashInHand,
        total_asset: updatedTotalAsset,
        per_share_value: updatedPerShareValue,
        updated_at: serverTimestamp(),
        last_edited_by: editorName,
      }, { merge: true });

      // 2. Update Member Doc in Firestore
      transaction.set(memberRef, {
        total_deposited: updatedMemberDeposit,
        total_fine_paid: updatedMemberFine,
        current_equity_value: updatedMemberEquity,
        updated_at: serverTimestamp(),
        last_edited_by: editorName,
      }, { merge: true });

      // 3. Update Transaction Record Doc in Firestore
      transaction.set(txRef, {
        amount: newTotalPaid,
        principalAmount: Number(newKistiAmount),
        fineAmount: Number(newFineAmount),
        fine: Number(newFineAmount),
        date: newDate,
        target_month: newTargetMonth,
        targetMonth: newTargetMonth,
        is_edited: true,
        correction_reason: correctionReason || null,
        last_edited_at: serverTimestamp(),
        edited_by: editorName,
      }, { merge: true });

      // 4. Update Central somiti_data/central_database Document
      if (centralSnap.exists()) {
        const bundle = centralSnap.data();
        const txs: any[] = Array.isArray(bundle.transactions) ? bundle.transactions : [];
        const mems: any[] = Array.isArray(bundle.members) ? bundle.members : [];
        const cbook: any[] = Array.isArray(bundle.cashbook) ? bundle.cashbook : [];

        const updatedTxs = txs.map((t) => {
          if (t.id === transactionId) {
            return {
              ...t,
              amount: newTotalPaid,
              principalAmount: Number(newKistiAmount),
              fineAmount: Number(newFineAmount),
              totalPaid: newTotalPaid,
              date: newDate,
              actualPaymentDate: newDate,
              targetMonth: newTargetMonth,
              periodMonth: newTargetMonth,
              remarks: t.remarks
                ? (correctionReason ? `${t.remarks} [সংশোধিত: ${correctionReason}]` : `${t.remarks} [সংশোধিত]`)
                : (correctionReason ? `[সংশোধিত: ${correctionReason}]` : '[সংশোধিত]'),
              isEdited: true,
              is_edited: true,
              correctionReason: correctionReason || null,
              lastEditedAt: new Date().toISOString(),
              editedBy: editorName,
            };
          }
          return t;
        });

        const updatedMems = mems.map((m) => {
          if (m.id === memberId) {
            const newSavings = Math.max(0, (m.totalSavingsDeposited || 0) + kistiDiff);
            const newFine = Math.max(0, (m.total_fine_paid || 0) + fineDiff);
            return {
              ...m,
              totalSavingsDeposited: newSavings,
              total_deposited: newSavings,
              total_fine_paid: newFine,
              current_equity_value: updatedMemberEquity,
            };
          }
          return m;
        });

        const updatedCashbook = cbook.map((cb) => {
          if (cb.relatedMemberId === memberId && (cb.notes?.includes(transactionId) || (cb.category === 'kisti_collection' && cb.date === newDate))) {
            return {
              ...cb,
              amount: Math.max(0, Number(cb.amount || 0) + totalCashDiff),
              date: newDate,
              notes: `${cb.notes || ''} [সংশোধিত]`,
            };
          }
          return cb;
        });

        transaction.set(centralDocRef, cleanPayload({
          ...bundle,
          transactions: updatedTxs,
          members: updatedMems,
          cashbook: updatedCashbook,
          version: (bundle.version || 0) + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: editorName,
        }), { merge: true });
      }
    });

    return { success: true };
  } catch (err: any) {
    console.error('Firebase runTransaction error in handleEditKistiTransaction:', err);
    handleFirestoreError(err, OperationType.UPDATE, `transactions/${transactionId}`);
    return { success: false, error: err?.message || 'Transaction update failed' };
  }
};

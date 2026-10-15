/**
 * Central Cloud Database Client for Google AI Studio Shared Links & Mobile/Web Sync
 * Powered by Firebase Firestore:
 * - Project: friend-initiative-organization
 * - Collection: somiti_data
 * - Document: central_database
 *
 * Realtime synchronization via Firebase onSnapshot
 */

import {
  fetchFromFirebase,
  pushToFirebase,
  subscribeToFirebase,
  verifyFirebaseConnection,
  centralDocRef,
  db,
  SomitiCloudBundle,
} from './firebase';

export {
  fetchFromFirebase,
  pushToFirebase,
  subscribeToFirebase,
  verifyFirebaseConnection,
  centralDocRef,
  db,
};

export type CloudSyncBundle = SomitiCloudBundle;

export interface CloudDbConfig {
  provider: 'firestore';
  projectId: string;
  collection: string;
  document: string;
}

const DEFAULT_CONFIG_KEY = 'somiti_cloud_db_config_v3';
const CLOUD_CACHE_KEY = 'somiti_cloud_db_cached_bundle_v3';

export function getCloudDbConfig(): CloudDbConfig {
  return {
    provider: 'firestore',
    projectId: 'friend-initiative-organization',
    collection: 'somiti_data',
    document: 'central_database',
  };
}

export function saveCloudDbConfig(_cfg: Partial<CloudDbConfig>) {
  try {
    localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(getCloudDbConfig()));
  } catch {}
}

/**
 * Verify Firestore Database connection status and return diagnostic info
 */
export async function verifyCloudDbConnection(): Promise<{
  connected: boolean;
  message: string;
  version?: number;
  membersCount?: number;
}> {
  return verifyFirebaseConnection();
}

/**
 * Fetch authoritative data from Central Firestore Cloud DB
 */
export async function fetchFromCloudDb(): Promise<CloudSyncBundle | null> {
  // 1. First priority: Firestore
  try {
    const firestoreData = await fetchFromFirebase();
    if (firestoreData && Array.isArray(firestoreData.members) && firestoreData.members.length > 0) {
      cacheCloudBundle(firestoreData);
      return firestoreData;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking local server fallback:', err);
  }

  // 2. Fallback to local Express /api/data endpoint if offline
  try {
    const localRes = await fetch('/api/data', { cache: 'no-store' });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data && Array.isArray(data.members)) {
        cacheCloudBundle(data);
        return data;
      }
    }
  } catch {}

  // 3. Fallback to cached bundle
  return getCachedCloudBundle();
}

/**
 * Save authoritative data to Central Cloud DB (Firebase Firestore)
 */
export async function pushToCloudDb(
  bundle: Partial<CloudSyncBundle>
): Promise<{ success: boolean; version?: number; error?: string }> {
  // 1. Push to Firestore
  const firestoreRes = await pushToFirebase(bundle);

  // 2. Also keep local Express server up to date in background
  try {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
    }).catch(() => {});
  } catch {}

  return firestoreRes;
}

/**
 * Direct Atomic Update of Member Credentials inside Firestore
 */
export async function updateCredentialsInCloudDb(
  memberId: string,
  newMemberNo?: string,
  newPassword?: string,
  updatedBy: string = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await fetchFromFirebase();
    if (!current || !Array.isArray(current.members)) {
      return { success: false, error: 'Could not load data from Firestore' };
    }

    const updatedMembers = current.members.map((m: any) => {
      if (m.id === memberId || m.memberNo === memberId) {
        return {
          ...m,
          memberNo: newMemberNo ? newMemberNo.trim().toUpperCase() : m.memberNo,
          password: newPassword ? newPassword.trim() : m.password,
        };
      }
      return m;
    });

    return await pushToFirebase({
      members: updatedMembers,
      updatedBy,
    });
  } catch (err: any) {
    return { success: false, error: err?.message || 'Firestore credentials update failed' };
  }
}

export function cacheCloudBundle(bundle: CloudSyncBundle) {
  try {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(bundle));
  } catch {}
}

export function getCachedCloudBundle(): CloudSyncBundle | null {
  try {
    const raw = localStorage.getItem(CLOUD_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

import { app as existingApp } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

let app = existingApp;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

export { app };

function initAuth() {
  if (_auth) return _auth;

  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: unknown) {
    const firebaseError = e as { code?: string };
    if (firebaseError.code === 'auth/already-initialized') {
      _auth = getAuth(app);
    } else {
      if (__DEV__) console.error('[Firebase Auth] Initialization failed:', e);
      _auth = getAuth(app);
    }
  }

  return _auth;
}

function initDb() {
  if (_db) return _db;

  try {
    _db = getFirestore(app);
  } catch {
    try {
      _db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      });
    } catch (initError) {
      if (__DEV__) console.error('[Firebase Firestore] Initialization failed:', initError);
      _db = getFirestore(app);
    }
  }

  return _db;
}

export const auth = initAuth();
export const db = initDb();

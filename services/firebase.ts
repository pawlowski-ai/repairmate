import { app as existingApp } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

let app = existingApp;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

export { app };

// Initialize auth IMMEDIATELY with AsyncStorage persistence
function initAuth() {
  if (_auth) return _auth;
  
  try {
    // Try to initialize with React Native persistence first (best practice)
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('[Firebase Auth] Initialized with AsyncStorage persistence');
  } catch (e: any) {
    // If already initialized, get existing instance
    if (e.code === 'auth/already-initialized') {
      _auth = getAuth(app);
      console.log('[Firebase Auth] Using existing auth instance');
    } else {
      console.error('[Firebase Auth] Initialization failed:', e);
      // Fallback to basic auth without persistence
      try {
        _auth = getAuth(app);
      } catch (fallbackError) {
        console.error('[Firebase Auth] Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  return _auth;
}

function initDb() {
  if (_db) return _db;
  
  try {
    // Try to get existing Firestore instance first
    _db = getFirestore(app);
  } catch (e) {
    // If that fails, initialize with custom settings
    try {
      _db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      });
    } catch (initError) {
      console.error('[Firebase Firestore] Initialization failed:', initError);
      // Last resort: basic initialization
      _db = getFirestore(app);
    }
  }
  
  return _db;
}

// Export initialized instances directly (not proxies)
export const auth = initAuth();
export const db = initDb();


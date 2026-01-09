import { app as existingApp } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

let app = existingApp;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

export { app };

// Lazy initialization with error handling to prevent crashes during app startup
function getAuthInstance() {
  if (!_auth) {
    try {
      // Try to get existing auth instance first
      _auth = getAuth(app);
    } catch (e) {
      // If that fails, initialize with React Native persistence
      try {
        _auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (initError) {
        console.error('[Firebase Auth] Initialization failed:', initError);
        // Fallback to basic auth without persistence
        _auth = getAuth(app);
      }
    }
  }
  return _auth;
}

function getDbInstance() {
  if (!_db) {
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
  }
  return _db;
}

// Export as getters to ensure lazy initialization
export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(target, prop) {
    const instance = getAuthInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(target, prop) {
    const instance = getDbInstance();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});



import { app as existingApp } from '@/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

let app = existingApp;
let _auth: ReturnType<typeof getAuth> | null = null;
let _db: ReturnType<typeof getFirestore> | null = null;

export { app };

export const auth = (() => {
  if (!_auth) {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  return _auth;
})();

export const db = (() => {
  if (!_db) {
    try {
      _db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false,
      });
    } catch {
      _db = getFirestore(app);
    }
  }
  return _db;
})();



import { db } from '@/services/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

/**
 * Create or update user document in Firestore after authentication.
 * Preserves existing data (plan, consent status) while updating timestamps.
 */
export async function upsertUserDoc(uid: string): Promise<void> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  const now = serverTimestamp();

  await setDoc(ref, {
    plan: existing?.plan ?? 'free',
    callsTotal: typeof existing?.callsTotal === 'number' ? existing.callsTotal : 0,
    consented: existing?.consented === true,
    createdAt: snap.exists() ? existing.createdAt ?? now : now,
    updatedAt: now,
  }, { merge: true });
}

/**
 * Validate email and password input for auth forms.
 * Returns error message string or null if valid.
 */
export function validateAuthInput(email: string, password: string): string | null {
  if (!email.trim() || !password) return 'Email and password are required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

/**
 * Map Firebase Auth error codes to user-friendly messages.
 */
export function getAuthErrorMessage(code: string | undefined, fallbackMessage: string): string {
  if (!code) return fallbackMessage;

  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/user-not-found': 'Account not found',
    'auth/invalid-email': 'Invalid email address',
    'auth/invalid-argument': 'Invalid email or password format',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password is too weak',
  };

  return messages[code] ?? `Failed: ${code.replace('auth/', '')}`;
}

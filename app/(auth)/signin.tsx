import AuthForm from '@/components/AuthForm';
import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertUserDoc = useCallback(async (uid: string) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? (snap.data() as any) : {};
    const now = serverTimestamp();

    await setDoc(ref, {
      plan: existing?.plan ?? 'free',
      callsTotal: typeof existing?.callsTotal === 'number' ? existing.callsTotal : 0,
      consented: existing?.consented === true,  // Keep existing consent status
      createdAt: snap.exists() ? existing.createdAt ?? now : now,
      updatedAt: now,
    }, { merge: true });

    console.log('[SignIn] User document updated:', {
      uid,
      exists: snap.exists(),
      consented: existing?.consented === true,
    });

    // Navigation is handled by RootLayout to prevent double redirects
  }, [db]);

  const validate = (email: string, password: string): string | null => {
    if (!email.trim() || !password) return 'Email and password are required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    const v = validate(email, password);
    if (v) { setError(v); return; }
    setIsLoading(true);
    try {
      if (__DEV__) {
        console.log('[SignIn] Attempting sign in for:', email.trim());
      }
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('[SignIn] Sign in successful, UID:', cred.user.uid);
      await upsertUserDoc(cred.user.uid);
      setIsLoading(false);
    } catch (e: any) {
      console.error('[SignIn] Error:', e);
      console.error('[SignIn] Error code:', e?.code);
      console.error('[SignIn] Error message:', e?.message);
      const code = e?.code as string | undefined;
      let message = 'Failed to sign in';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        message = 'Invalid email or password';
      } else if (code === 'auth/user-not-found') {
        message = 'Account not found';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (code === 'auth/invalid-argument') {
        message = 'Invalid email or password format';
      } else if (code) {
        message = `Failed: ${code.replace('auth/', '')}`;
      } else if (e?.message) {
        message = `Error: ${e.message}`;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  // Social logins are placeholders at MVP stage – handled in AuthForm UI only

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthForm mode="signin" onSubmit={handleSignIn} isSubmitting={isLoading} errorMessage={error} />
    </SafeAreaView>
  );
}
 

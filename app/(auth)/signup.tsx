import AuthForm from '@/components/AuthForm';
import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native';

export default function SignUpScreen() {
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
      consented: existing?.consented === true,
      createdAt: snap.exists() ? existing.createdAt ?? now : now,
      updatedAt: now,
    }, { merge: true });
    // Navigation is handled by RootLayout to prevent double redirects
  }, [db]);

  const handleSignUp = async (email: string, password: string) => {
    setError(null);
    if (!email.trim() || !password) { setError('All fields are required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      if (__DEV__) {
        console.log('[SignUp] Starting registration for:', email.trim());
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (__DEV__) {
        console.log('[SignUp] User created successfully, UID:', cred.user.uid);
      }
      await upsertUserDoc(cred.user.uid);
      if (__DEV__) {
        console.log('[SignUp] User document created successfully');
      }
    } catch (e: any) {
      if (__DEV__) {
        console.error('[SignUp] Error:', e);
        console.error('[SignUp] Error code:', e?.code);
        console.error('[SignUp] Error message:', e?.message);
      }
      const code = e?.code as string | undefined;
      let message = 'Failed to create account';
      if (code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (code) {
        message = `Failed: ${code.replace('auth/', '')}`;
      } else if (e?.message) {
        message = `Error: ${e.message}`;
      }
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthForm mode="signup" onSubmit={handleSignUp} isSubmitting={isLoading} errorMessage={error} />
    </SafeAreaView>
  );
}

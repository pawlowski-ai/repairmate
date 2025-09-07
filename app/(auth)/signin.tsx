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
      consented: existing?.consented === true,
      createdAt: snap.exists() ? existing.createdAt ?? now : now,
      updatedAt: now,
    }, { merge: true });

    const consented = existing?.consented === true;
    router.replace(consented ? '/' : '/consents');
  }, [db, router]);

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
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const message =
        code === 'auth/invalid-credential' ? 'Invalid email or password'
        : code === 'auth/user-not-found' ? 'Account not found'
        : code === 'auth/wrong-password' ? 'Wrong password'
        : 'Failed to sign in';
      setError(message);
    } finally {
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
 

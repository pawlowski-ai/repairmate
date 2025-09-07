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
    const consented = existing?.consented === true;
    router.replace(consented ? '/' : '/consents');
  }, [db, router]);

  const handleSignUp = async (email: string, password: string) => {
    setError(null);
    if (!email.trim() || !password) { setError('All fields are required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
    } catch (e: any) {
      const code = e?.code as string | undefined;
      const message = code === 'auth/email-already-in-use' ? 'Email already in use' : 'Failed to create account';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthForm mode="signup" onSubmit={handleSignUp} isSubmitting={isLoading} errorMessage={error} />
    </SafeAreaView>
  );
}

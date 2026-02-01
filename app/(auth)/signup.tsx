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
      consented: existing?.consented === true,  // Keep existing consent status
      createdAt: snap.exists() ? existing.createdAt ?? now : now,
      updatedAt: now,
    }, { merge: true });
    console.log('[SignUp] User document created/updated:', {
      uid,
      exists: snap.exists(),
      consented: existing?.consented === true,
    });
    // Navigation is handled by RootLayout to prevent double redirects
  }, [db]);

  const handleSignUp = async (email: string, password: string) => {
    setError(null);
    if (!email.trim() || !password) { setError('All fields are required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setIsLoading(true);
    try {
      console.log('[SignUp] ========== STARTING REGISTRATION ==========');
      console.log('[SignUp] Email:', email.trim());
      console.log('[SignUp] Password length:', password.length);
      console.log('[SignUp] Auth instance:', typeof auth);
      
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log('[SignUp] ✅ User created successfully in Firebase Auth');
      console.log('[SignUp] UID:', cred.user.uid);
      console.log('[SignUp] Email:', cred.user.email);
      
      await upsertUserDoc(cred.user.uid);
      console.log('[SignUp] ✅ User document created in Firestore');
      console.log('[SignUp] ========== REGISTRATION COMPLETE ==========');
      console.log('[SignUp] Waiting for RootLayout to handle navigation...');
      
      setIsLoading(false);
    } catch (e: any) {
      console.error('[SignUp] ========== REGISTRATION FAILED ==========');
      console.error('[SignUp] Error:', e);
      console.error('[SignUp] Error code:', e?.code);
      console.error('[SignUp] Error message:', e?.message);
      console.error('[SignUp] Full error object:', JSON.stringify(e, null, 2));
      
      const code = e?.code as string | undefined;
      let message = 'Failed to create account';
      if (code === 'auth/email-already-in-use') {
        message = 'Email already in use';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak';
      } else if (code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (code === 'auth/invalid-argument') {
        message = 'Invalid email or password format';
        console.error('[SignUp] INVALID ARGUMENT - This suggests Auth initialization issue!');
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

import AuthForm from '@/components/AuthForm';
import { auth } from '@/services/firebase';
import { getAuthErrorMessage, upsertUserDoc, validateAuthInput } from '@/utils/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

export default function SignInScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    setError(null);
    const validationError = validateAuthInput(email, password);
    if (validationError) { setError(validationError); return; }
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
      setIsLoading(false);
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string };
      if (__DEV__) console.error('[SignIn] Error:', firebaseError.code, firebaseError.message);
      setError(getAuthErrorMessage(firebaseError.code, firebaseError.message ?? 'Failed to sign in'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthForm mode="signin" onSubmit={handleSignIn} isSubmitting={isLoading} errorMessage={error} />
    </SafeAreaView>
  );
}

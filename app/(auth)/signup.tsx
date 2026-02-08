import AuthForm from '@/components/AuthForm';
import { auth } from '@/services/firebase';
import { getAuthErrorMessage, upsertUserDoc, validateAuthInput } from '@/utils/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';

export default function SignUpScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (email: string, password: string) => {
    setError(null);
    const validationError = validateAuthInput(email, password);
    if (validationError) { setError(validationError); return; }
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
      setIsLoading(false);
    } catch (e: unknown) {
      const firebaseError = e as { code?: string; message?: string };
      if (__DEV__) console.error('[SignUp] Error:', firebaseError.code, firebaseError.message);
      setError(getAuthErrorMessage(firebaseError.code, firebaseError.message ?? 'Failed to create account'));
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AuthForm mode="signup" onSubmit={handleSignUp} isSubmitting={isLoading} errorMessage={error} />
    </SafeAreaView>
  );
}

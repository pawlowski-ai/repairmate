import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const validate = (): string | null => {
    if (!email.trim() || !password) return 'Email i hasło są wymagane';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Podaj poprawny adres e-mail';
    if (password.length < 6) return 'Hasło musi mieć co najmniej 6 znaków';
    return null;
  };

  const handleSignIn = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się zalogować');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserDoc(cred.user.uid);
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się utworzyć konta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleWeb = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await upsertUserDoc(cred.user.uid);
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się zalogować Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Sign in</Text>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94a3b8" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={handleSignIn} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleCreate} style={({ pressed }) => [styles.buttonGhost, pressed && styles.pressed]}>
            <Text style={styles.buttonGhostText}>Create account</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleGoogleWeb} style={({ pressed }) => [styles.buttonGoogle, pressed && styles.pressed]}>
            <Text style={styles.buttonGoogleText}>Continue with Google (web)</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: '800', color: '#38bdf8', textAlign: 'center', marginBottom: 8 },
  form: { gap: 12 },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, color: '#f1f5f9' },
  error: { color: '#f87171', textAlign: 'center', marginTop: 4 },
  actions: { marginTop: 8, gap: 12 },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonGhost: { borderWidth: 1, borderColor: '#334155', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonGhostText: { color: '#cbd5e1', fontSize: 16, fontWeight: '600' },
  buttonGoogle: { backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  buttonGoogleText: { color: '#111827', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.9 },
});



import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ConsentsScreen() {
  const router = useRouter();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = acceptTerms && acceptPrivacy && !isSaving;

  const handleContinue = async () => {
    setError(null);
    const current = auth.currentUser;
    if (!current) { router.replace('/signin'); return; }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', current.uid), { consented: true, updatedAt: serverTimestamp() }, { merge: true });
      router.replace('/');
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się zapisać zgody.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Consents</Text>

        <View style={styles.card}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptTerms }} onPress={() => setAcceptTerms(v => !v)} style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>I accept the Terms of Use</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.link}>Read Terms</Text>
          </Pressable>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptPrivacy }} onPress={() => setAcceptPrivacy(v => !v)} style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>I accept the Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Read Privacy Policy</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable accessibilityRole="button" disabled={!canContinue} onPress={handleContinue} style={({ pressed }) => [styles.button, (!canContinue && styles.buttonDisabled) || (pressed && styles.pressed)]}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: '800', color: '#38bdf8', textAlign: 'center' },
  card: { backgroundColor: '#1e293b', borderRadius: 10, padding: 16, gap: 12, borderWidth: 1, borderColor: '#334155' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#94a3b8', backgroundColor: 'transparent' },
  checkboxChecked: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  checkboxLabel: { color: '#e2e8f0', fontSize: 16 },
  link: { color: '#93c5fd', textDecorationLine: 'underline' },
  error: { color: '#f87171', textAlign: 'center' },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.9 },
});



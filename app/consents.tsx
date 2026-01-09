import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { auth, db } from '@/services/firebase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export default function ConsentsScreen() {
  const router = useRouter();
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptUpdates, setAcceptUpdates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const imageHeight = Math.min(420, Math.round((width || 375) * 0.75));

  const allChecked = useMemo(() => acceptPrivacy && acceptTerms && acceptUpdates, [acceptPrivacy, acceptTerms, acceptUpdates]);
  const canContinue = acceptPrivacy && acceptTerms && !isSaving;

  const handleContinue = async () => {
    setError(null);
    const current = auth.currentUser;
    if (!current) { router.replace('/signin'); return; }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', current.uid), { consented: true, updatedAt: serverTimestamp() }, { merge: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.replace('/onboarding' as any);
    } catch (e: any) {
      setError(e?.message ?? 'Nie udało się zapisać zgody.');
    } finally {
      setIsSaving(false);
    }
  };

  const acceptAll = () => {
    if (!allChecked) {
      setAcceptPrivacy(true);
      setAcceptTerms(true);
      setAcceptUpdates(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <View style={styles.heroContainer}>
          <Image
            source={require('../graph.assets/Privacy.asset.png')}
            resizeMode="contain"
            style={[styles.hero, { width: '100%', height: imageHeight }]}
          />
        </View>

        <Text accessibilityRole="header" style={styles.title}>BEFORE WE START</Text>
        <Text style={styles.lead}>We need your consent to continue. Please review and accept.</Text>

        <View style={styles.list}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptPrivacy }} onPress={() => setAcceptPrivacy(v => !v)} style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, acceptPrivacy && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>
              I accept the <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>.
            </Text>
          </Pressable>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptTerms }} onPress={() => setAcceptTerms(v => !v)} style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>
              I accept the <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>Terms of Use</Text>.
            </Text>
          </Pressable>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptUpdates }} onPress={() => setAcceptUpdates(v => !v)} style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
            <View style={[styles.checkbox, acceptUpdates && styles.checkboxChecked]} />
            <Text style={styles.checkboxLabel}>I agree to receive product tips and updates.</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" onPress={acceptAll} style={({ pressed }) => [styles.acceptAll, pressed && styles.pressed]}>
            <Text style={styles.acceptAllLabel}>Accept all</Text>
          </Pressable>

          <Pressable accessibilityRole="button" disabled={!canContinue} onPress={handleContinue} style={({ pressed }) => [styles.button, (!canContinue && styles.buttonDisabled) || (pressed && styles.pressed)]}>
            {isSaving ? <ActivityIndicator color="#0B0B0B" /> : <Text style={styles.buttonText}>Next</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#000000' },
  heroContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 16 },
  hero: { width: '100%', height: 280 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.2 },
  lead: { marginTop: 8, color: '#B9B9B9', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  list: { marginTop: 16, gap: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#2A2A2A', backgroundColor: 'transparent' },
  checkboxChecked: { backgroundColor: '#27D969', borderColor: '#27D969' },
  checkboxLabel: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  link: { color: '#93c5fd', textDecorationLine: 'underline' },
  error: { color: '#F87171', textAlign: 'center', marginTop: 8 },
  footer: { marginTop: 24 },
  acceptAll: { alignItems: 'center', paddingVertical: 8 },
  acceptAllLabel: { color: '#FFFFFF', fontSize: 14 },
  button: { marginTop: 16, height: 56, backgroundColor: '#27D969', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: '#2A2A2A' },
  buttonText: { color: '#0B0B0B', fontSize: 18, lineHeight: 22, fontWeight: '600', textAlign: 'center', width: '100%' },
  pressed: { opacity: 0.9 },
});



import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function PaywallScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Get RepairMate Pro</Text>
        <View style={styles.card}>
          <Text style={styles.bullet}>• Unlimited AI diagnostics</Text>
          <Text style={styles.bullet}>• Step-by-step guidance</Text>
          <Text style={styles.bullet}>• Priority responses</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => console.log('TODO purchase')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Go Pro (placeholder)</Text>
          </Pressable>
          <Pressable onPress={() => console.log('TODO restore')} style={({ pressed }) => [styles.buttonGhost, pressed && styles.pressed]}>
            <Text style={styles.buttonGhostText}>Restore (placeholder)</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.replace('/')} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: '800', color: '#38bdf8', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: '#1e293b', borderRadius: 10, padding: 16, gap: 8, borderWidth: 1, borderColor: '#334155' },
  bullet: { color: '#e2e8f0', fontSize: 16 },
  actions: { marginTop: 8, gap: 12 },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonGhost: { borderWidth: 1, borderColor: '#334155', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonGhostText: { color: '#cbd5e1', fontSize: 16, fontWeight: '600' },
  back: { alignItems: 'center', paddingVertical: 12 },
  backText: { color: '#93c5fd', fontSize: 16, textDecorationLine: 'underline' },
  pressed: { opacity: 0.9 },
});



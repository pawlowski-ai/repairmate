import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>RepairMate</Text>
        <Text style={styles.subtitle}>Your AI-powered assistant to diagnose issues and guide simple repairs.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/signin')} style={({ pressed }) => [styles.button, pressed && styles.pressed] }>
          <Text style={styles.buttonText}>Get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#0f172a' },
  title: { fontSize: 40, fontWeight: '800', color: '#38bdf8', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#cbd5e1', textAlign: 'center', lineHeight: 22, maxWidth: 560 },
  button: { backgroundColor: '#0ea5e9', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  pressed: { opacity: 0.9 },
});



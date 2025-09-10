import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OnboardingOne() {
  const router = useRouter();

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>Fix smarter.</Text>
        <Text style={styles.lead}>Mendwise tells you what’s wrong and how to fix it.</Text>

        <TouchableOpacity accessibilityRole="button" onPress={handleNext} activeOpacity={0.9} style={styles.cta}>
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  lead: { marginTop: 8, color: '#B9B9B9', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  cta: { marginTop: 24, height: 56, backgroundColor: '#27D969', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#0B0B0B', fontSize: 18, lineHeight: 22, fontWeight: '600', textAlign: 'center', width: '100%' },
});



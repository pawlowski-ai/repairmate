import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ImageBackground, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();
  const [isSetting, setIsSetting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleStart = async () => {
    if (isSetting) return;
    setIsSetting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.replace('/signin');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Hero 62% wysokości po safe area */}
      <View style={{ height: `62%`, width: '100%', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}>
        <ImageBackground
          source={require('../graph.assets/splash.hero.png')}
          resizeMode="cover"
          style={styles.bg}
        />
      </View>

      {/* Teksty i CTA */}
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.headline}>SAVE CASH.{"\n"}FEEL CAPABLE.</Text>
        <Text style={styles.subhead}>Mendwise makes you handyman.</Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleStart}
          activeOpacity={0.9}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Start Now!</Text>
        </TouchableOpacity>

        <View style={{ height: Math.max(16, insets.bottom) }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  headline: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 0.2 },
  subhead: { marginTop: 8, color: '#B9B9B9', fontSize: 14, lineHeight: 20 },
  cta: {
    marginTop: 16,
    height: 56,
    backgroundColor: '#27D969',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#0B0B0B', fontSize: 18, lineHeight: 22, fontWeight: '600', textAlign: 'center', width: '100%' },
});



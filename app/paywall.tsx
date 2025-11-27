import { PRIVACY_URL, TERMS_URL } from '@/constants/legal';
import { auth, db } from '@/services/firebase';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// TODO: Replace with your actual RevenueCat API Keys
const API_KEY_IOS = 'sk_neRZcYSyIzluakZKApcLvcgMNmNiq';
const API_KEY_ANDROID = 'sk_neRZcYSyIzluakZKApcLvcgMNmNiq';

export default function PaywallScreen() {
  const router = useRouter();
  const [currentOffering, setCurrentOffering] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const initRC = async () => {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: API_KEY_IOS });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: API_KEY_ANDROID });
      }
      
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          // Assuming we want the monthly package, or the first available
          const monthly = offerings.current.availablePackages.find(p => p.packageType === 'MONTHLY');
          setCurrentOffering(monthly || offerings.current.availablePackages[0]);
        }
      } catch (e) {
        console.log('RevenueCat Error', e);
      }
    };
    initRC();
  }, []);

  const features = [
    { text: 'Unlimited AI Diagnoses' },
    { text: 'Step-by-step Repair Guides' },
    { text: 'Photo Analysis & Recognition' },
    { text: '24/7 Instant Assistance' },
  ];

  const handlePurchase = async () => {
    if (!currentOffering) {
      // Fallback for testing UI without configured keys
      // Alert.alert("Configuration Error", "Please configure RevenueCat API Keys.");
      // For MVP demo purpose, we might want to just console log if keys are missing
      console.log("No offering loaded. Check API Keys.");
      return;
    }
    
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(currentOffering);
      if (customerInfo.entitlements.active['pro']) { // 'pro' must match entitlement ID in RC
        const uid = auth.currentUser?.uid;
        if (uid) {
          await setDoc(doc(db, 'users', uid), { plan: 'pro' }, { merge: true });
        }
        Alert.alert("Success", "You are now a Pro member!");
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Error", e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active['pro']) {
        const uid = auth.currentUser?.uid;
        if (uid) {
          await setDoc(doc(db, 'users', uid), { plan: 'pro' }, { merge: true });
        }
        Alert.alert("Restored", "Your Pro access has been restored.");
        router.back();
      } else {
        Alert.alert("Info", "No active Pro subscription found to restore.");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={20} style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}>
            <Ionicons name="close" size={24} color="#B9B9B9" />
          </Pressable>
        </View>

        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Ionicons name="trophy" size={32} color="#0B0B0B" />
          </View>
          <Text style={styles.title}>Become a DIY Pro</Text>
          <Text style={styles.subtitle}>
            Save thousands on repairs.{"\n"}Fix it yourself with unlimited guidance.
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color="#27D969" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offerContainer}>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planLabel}>MONTHLY ACCESS</Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>FLEXIBLE</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>9.99</Text>
              <Text style={styles.period}>/ month</Text>
            </View>
            <Text style={styles.equivalent}>Cancel anytime. No commitment.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable onPress={handlePurchase} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
            {isPurchasing ? <ActivityIndicator color="#0B0B0B" /> : <Text style={styles.ctaText}>Unlock Full Access</Text>}
          </Pressable>
          <Text style={styles.guarantee}>Secured by App Store & Google Play</Text>

          <Pressable onPress={handleRestore} style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>

          <View style={styles.legalRow}>
            <Text onPress={() => Linking.openURL(TERMS_URL)} style={styles.legalLink}>Terms of Use</Text>
            <Text style={styles.legalDivider}>•</Text>
            <Text onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.legalLink}>Privacy Policy</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 16, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#111' },
  
  header: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  iconBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#27D969',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#27D969', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }
  },
  title: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 12, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#B9B9B9', textAlign: 'center', lineHeight: 24 },

  featuresContainer: { gap: 16, marginBottom: 40 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },

  offerContainer: { marginBottom: 24 },
  planCard: {
    backgroundColor: '#111111',
    borderWidth: 2, borderColor: '#27D969',
    borderRadius: 20,
    padding: 20,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  saveBadge: { backgroundColor: '#27D969', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  saveText: { color: '#0B0B0B', fontSize: 12, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  currency: { color: '#FFFFFF', fontSize: 24, fontWeight: '600', marginRight: 2 },
  price: { color: '#FFFFFF', fontSize: 40, fontWeight: '900' },
  period: { color: '#B9B9B9', fontSize: 16, fontWeight: '500', marginLeft: 4 },
  equivalent: { color: '#B9B9B9', fontSize: 14, marginTop: 4 },

  footer: { marginTop: 'auto', gap: 16, alignItems: 'center' },
  cta: {
    width: '100%', height: 56,
    backgroundColor: '#27D969',
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#27D969', shadowOpacity: 0.2, shadowRadius: 10,
  },
  ctaText: { color: '#0B0B0B', fontSize: 18, fontWeight: '700' },
  guarantee: { color: '#5A5A5A', fontSize: 12, marginTop: -8 },
  
  restoreBtn: { padding: 8 },
  restoreText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  legalLink: { color: '#5A5A5A', fontSize: 12 },
  legalDivider: { color: '#5A5A5A', fontSize: 12 },
});



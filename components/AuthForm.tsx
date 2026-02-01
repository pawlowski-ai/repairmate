import { auth, db } from '@/services/firebase';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';


type AuthMode = 'signin' | 'signup';


type Props = {
  mode: AuthMode,
  onSubmit: (email: string, password: string) => Promise<void> | void,
  isSubmitting?: boolean,
  errorMessage?: string | null,
};


export default function AuthForm({ mode, onSubmit, isSubmitting = false, errorMessage }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '432126526994-qf7v8bthqohpvik7s51utjd7io8jin3m.apps.googleusercontent.com', // Web Client ID for backend verification
      offlineAccess: false,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      
      console.log('[GoogleSignIn] Starting sign in...');
      
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log('[GoogleSignIn] Got user info:', userInfo.user);
      
      if (!userInfo.idToken) {
        throw new Error('No ID token received from Google');
      }
      
      const credential = GoogleAuthProvider.credential(userInfo.idToken);
      const result = await signInWithCredential(auth, credential);
      
      console.log('[GoogleSignIn] Successfully signed in to Firebase, UID:', result.user.uid);
      
      // Create or update user document in Firestore (same as email/password flow)
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? (userSnap.data() as any) : {};
      const now = serverTimestamp();
      
      await setDoc(userRef, {
        plan: existingData?.plan ?? 'free',
        callsTotal: typeof existingData?.callsTotal === 'number' ? existingData.callsTotal : 0,
        consented: existingData?.consented === true,  // Keep existing consent status
        createdAt: userSnap.exists() ? existingData.createdAt ?? now : now,
        updatedAt: now,
      }, { merge: true });
      
      console.log('[GoogleSignIn] User document created/updated:', {
        uid: result.user.uid,
        exists: userSnap.exists(),
        consented: existingData?.consented === true,
      });
      
      // Navigation is handled by RootLayout based on consented status
    } catch (error: any) {
      console.error('[GoogleSignIn] Error:', error);
      console.error('[GoogleSignIn] Error code:', error.code);
      console.error('[GoogleSignIn] Error message:', error.message);
      
      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled the login flow
        return;
      } else if (error.code === 'IN_PROGRESS') {
        // Operation (e.g. sign in) is in progress already
        return;
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        console.error('[GoogleSignIn] Play services not available');
      }
      
      // Show error to user
      // You could add a state for Google Sign-In errors if needed
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !isSubmitting;

  const registrationImage = require('../graph.assets/registration.webp');

  const submit = async () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onSubmit(email.trim(), password);
  };

  const activeIsSignUp = mode === 'signup';
  const passwordPlaceholder = activeIsSignUp ? 'Create password' : 'Your password';

  return (
    <View style={styles.safeArea}> 
      <View style={styles.heroContainer}>
        <View style={styles.heroBackground}>
          {/* Background from raster asset */}
          <Image source={registrationImage} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <View style={styles.segment}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/signup')}
            style={({ pressed }) => [styles.segmentPill, activeIsSignUp ? styles.segmentPillActive : styles.segmentPillInactive, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, activeIsSignUp ? styles.segmentTextActive : styles.segmentTextInactive]}>SIGN UP</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/signin')}
            style={({ pressed }) => [styles.segmentPill, !activeIsSignUp ? styles.segmentPillActive : styles.segmentPillInactive, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, !activeIsSignUp ? styles.segmentTextActive : styles.segmentTextInactive]}>LOG IN</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.form}> 
        <TextInput
          style={styles.input}
          placeholder="Your e-mail address"
          placeholderTextColor="#B9B9B9"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder={passwordPlaceholder}
            placeholderTextColor="#B9B9B9"
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsPasswordVisible((v) => !v)}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
          >
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          disabled={!canSubmit}
          style={({ pressed }) => [styles.cta, (!canSubmit && styles.ctaDisabled) || null, pressed && styles.pressed]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#0B0B0B" />
          ) : (
            <Text style={styles.ctaText}>{activeIsSignUp ? 'SIGN UP' : 'LOG IN'}</Text>
          )}
        </Pressable>

        <View style={styles.socialSection}>
          <Text style={styles.socialLabel}>or use instead</Text>
          <View style={styles.socialIconsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              style={({ pressed }) => [styles.socialIconWrapper, pressed && styles.pressed]}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  heroContainer: { height: '42%', borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroBackground: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  segment: { position: 'absolute', bottom: 16, left: 24, right: 24, flexDirection: 'row', gap: 12, justifyContent: 'flex-start' },
  segmentPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  segmentPillActive: { backgroundColor: '#27D969', borderColor: '#27D969' },
  segmentPillInactive: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: '#2A2A2A' },
  segmentText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  segmentTextActive: { color: '#0B0B0B' },
  segmentTextInactive: { color: '#FFFFFF' },

  form: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#FFFFFF', borderWidth: 1, borderColor: '#2A2A2A' },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 12, top: 12, height: 28, width: 28, alignItems: 'center', justifyContent: 'center' },

  error: { color: '#F87171', textAlign: 'center', marginTop: 4 },

  cta: { height: 56, borderRadius: 28, backgroundColor: '#27D969', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaDisabled: { backgroundColor: '#2A2A2A' },
  ctaText: { color: '#0B0B0B', fontSize: 18, fontWeight: '600' },

  socialSection: { marginTop: 24, alignItems: 'center' },
  socialLabel: { color: '#B9B9B9', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  socialIconsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  socialIconWrapper: { height: 48, width: 48, borderRadius: 24, borderWidth: 1, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },

  pressed: { opacity: 0.9 },
});



import { AnimatedSplash } from "@/components/AnimatedSplash";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserMenu } from "@/components/UserMenu";
import { AppProvider } from "@/context/AppContext";
import { auth, db } from "@/services/firebase";
import { Stack, usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setIsLoading(false);
          const isAuthPath = pathname === "/splash" || pathname === "/signin" || pathname === "/signup";
          if (!isAuthPath && isMounted) {
            navigationTimeoutRef.current = setTimeout(() => {
              if (isMounted) router.replace("/splash");
            }, 100);
            return;
          }
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (__DEV__ && !snap.exists()) {
          console.warn('[RootLayout] User document missing in Firestore for UID:', user.uid);
        }

        const userData = snap.exists() ? snap.data() : {};
        const consented = userData?.consented === true;

        setIsLoading(false);

        if (!consented && pathname !== "/consents" && isMounted) {
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) router.replace("/consents");
          }, 200);
          return;
        }

        if (consented && (pathname === "/signin" || pathname === "/signup" || pathname === "/splash") && isMounted) {
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) router.replace("/");
          }, 200);
        }
      } catch (error) {
        if (__DEV__) console.error('[RootLayout] Auth state error:', error);
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [pathname, router, isMounted]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Show animated splash while loading auth state
  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <AnimatedSplash
          isReady={!isLoading}
          onAnimationComplete={handleSplashComplete}
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#000000' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="diagnosis" options={{ title: "Diagnosis", headerRight: () => <UserMenu /> }} />
          <Stack.Screen name="steps" options={{ title: "Steps", headerRight: () => <UserMenu /> }} />
          <Stack.Screen name="settings" options={{ title: "Settings", headerRight: () => <UserMenu /> }} />
          <Stack.Screen name="consents" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signin" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms of Use' }} />
        </Stack>
      </AppProvider>
    </ErrorBoundary>
  );
}

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UserMenu } from "@/components/UserMenu";
import { AppProvider } from "@/context/AppContext";
import { auth, db } from "@/services/firebase";
import { Stack, usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
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
        // Splash dla niezalogowanych
        if (!user) {
          console.log('[RootLayout] No user logged in');
          setIsLoading(false);
          const isAuthPath = pathname === "/splash" || pathname === "/signin" || pathname === "/signup";
          if (!isAuthPath && isMounted) {
            // Defer navigation to prevent race conditions
            navigationTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                console.log('[RootLayout] Redirecting to /splash (no user)');
                router.replace("/splash");
              }
            }, 100);
            return;
          }
          return;
        }

        console.log('[RootLayout] User logged in, UID:', user.uid);
        console.log('[RootLayout] Current pathname:', pathname);
        
        // Fetch user document from Firestore
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        console.log('[RootLayout] Firestore document exists:', snap.exists());
        
        if (!snap.exists()) {
          console.error('[RootLayout] CRITICAL: User document does NOT exist in Firestore!');
          console.log('[RootLayout] This means registration was incomplete');
          // For safety, still allow navigation but log the issue
        }
        
        const userData = snap.exists() ? (snap.data() as any) : {};
        const consented = userData?.consented === true;
        console.log('[RootLayout] User consented:', consented);
        console.log('[RootLayout] User data:', JSON.stringify(userData, null, 2));
        
        setIsLoading(false);
        
        // If not consented and not already on consents page, redirect
        if (!consented && pathname !== "/consents" && isMounted) {
          console.log('[RootLayout] User needs to consent, redirecting to /consents');
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              console.log('[RootLayout] Executing redirect to /consents');
              router.replace("/consents");
            }
          }, 200); // Increased timeout to 200ms
          return;
        }
        
        // If consented and on auth pages, redirect to home
        if (consented && (pathname === "/signin" || pathname === "/signup" || pathname === "/splash") && isMounted) {
          console.log('[RootLayout] User already consented, redirecting to /');
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              console.log('[RootLayout] Executing redirect to /');
              router.replace("/");
            }
          }, 200); // Increased timeout to 200ms
        }
      } catch (error) {
        console.error('[RootLayout] Auth state error:', error);
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [pathname, router, isMounted]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#38bdf8" />
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

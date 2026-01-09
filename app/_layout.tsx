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
          setIsLoading(false);
          const isAuthPath = pathname === "/splash" || pathname === "/signin" || pathname === "/signup";
          if (!isAuthPath && isMounted) {
            // Defer navigation to prevent race conditions
            navigationTimeoutRef.current = setTimeout(() => {
              if (isMounted) {
                router.replace("/splash");
              }
            }, 100);
            return;
          }
          return;
        }

        const snap = await getDoc(doc(db, 'users', user.uid));
        const consented = snap.exists() && (snap.data() as any)?.consented === true;
        setIsLoading(false);
        if (!consented && pathname !== "/consents" && isMounted) {
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              router.replace("/consents");
            }
          }, 100);
          return;
        }
        if (consented && (pathname === "/signin" || pathname === "/signup" || pathname === "/splash") && isMounted) {
          navigationTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              router.replace("/");
            }
          }, 100);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('[RootLayout] Auth state error:', error);
        }
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


import { UserMenu } from "@/components/UserMenu";
import { AppProvider } from "@/context/AppContext";
import { auth, db } from "@/services/firebase";
import { Stack, usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        // Splash dla niezalogowanych
        if (!user) {
          setIsLoading(false);
          const isAuthPath = pathname === "/splash" || pathname.includes("signin") || pathname.includes("signup");
          if (!isAuthPath) {
            router.replace("/splash");
            return;
          }
          return;
        }

        const snap = await getDoc(doc(db, 'users', user.uid));
        const consented = snap.exists() && (snap.data() as any)?.consented === true;
        setIsLoading(false);
        if (!consented && pathname !== "/consents") {
          router.replace("/consents");
          return;
        }
        if (consented && (pathname === "/signin" || pathname === "/signup" || pathname === "/splash")) {
          router.replace("/");
        }
      } catch {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: true, headerRight: () => <UserMenu /> }} />
        <Stack.Screen name="diagnosis" options={{ title: "Diagnosis", headerRight: () => <UserMenu /> }} />
        <Stack.Screen name="steps" options={{ title: "Steps", headerRight: () => <UserMenu /> }} />
        <Stack.Screen name="settings" options={{ title: "Settings", headerRight: () => <UserMenu /> }} />
        <Stack.Screen name="onboarding/1" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}

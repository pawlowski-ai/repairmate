import { auth } from '@/services/firebase';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  drawerWidth?: number; // px, optional override
  plan?: 'Free' | 'Pro';
};

export const SideDrawer: React.FC<Props> = ({ isOpen, onClose, drawerWidth, plan = 'Free' }) => {
  const router = useRouter();
  const user = auth.currentUser;
  // Używamy wartości w pikselach, aby uniknąć częściowej widoczności przed pomiarem
  const translateX = useRef(new Animated.Value(-10000)).current;
  const measuredWidthRef = useRef(0);

  useEffect(() => {
    const toValue = isOpen ? 0 : -measuredWidthRef.current;
    Animated.timing(translateX, {
      toValue,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOpen, translateX]);

  const initials = useMemo(() => {
    const v = user?.displayName || user?.email || 'User';
    return v
      .split('@')[0]
      .split(/([\.|\s|_|-]+)/)
      .filter(Boolean)
      .filter((s) => !/[\.|\s|_|-]+/.test(s))
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('');
  }, [user]);

  const close = () => onClose();

  const goPrivacy = () => {
    close();
    Linking.openURL('https://repairmate-mvp.web.app/privacy.html');
  };

  const goTerms = () => {
    close();
    Linking.openURL('https://repairmate-mvp.web.app/terms.html');
  };

  const handleUpgrade = () => {
    close();
    router.push('/paywall');
  };

  const handleSignOut = async () => {
    close();
    try {
      await auth.signOut();
    } finally {
      router.replace('/signin');
    }
  };

  return (
    <View pointerEvents={isOpen ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      {/* Backdrop click area at the right side to close */}
      {isOpen && <Pressable style={styles.backdrop} onPress={close} />}

      {/* Drawer panel */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[styles.drawer, { transform: [{ translateX }] }]}
          onLayout={(e) => {
            const w = drawerWidth ?? e.nativeEvent.layout.width;
            measuredWidthRef.current = w;
            // Ustaw poprawną pozycję startową natychmiast po pomiarze
            translateX.setValue(isOpen ? 0 : -w);
          }}
        >
          {/* Account */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'U'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1}>{user?.displayName || user?.email || 'User'}</Text>
                <Text style={styles.plan} numberOfLines={1}>Plan: {plan}</Text>
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Short list */}
          {plan !== 'Pro' && (
            <Pressable onPress={handleUpgrade} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
              <Text style={styles.itemText}>Upgrade to Pro</Text>
            </Pressable>
          )}

          <View style={styles.separator} />

          {/* Legal */}
          <Pressable onPress={goPrivacy} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <Text style={styles.itemText}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={goTerms} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <Text style={styles.itemText}>Terms of Use</Text>
          </Pressable>

          <View style={styles.separator} />

          {/* Logout */}
          <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
            <Text style={styles.itemText}>Log out</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: '84%', // keep a sliver of main screen visible when open
  },
  drawer: {
    position: 'absolute',
    top: 12,
    bottom: 0,
    left: 8,
    width: '84%',
    backgroundColor: '#0B0B0B', // gray wall over black background
    borderRightWidth: 1,
    borderRightColor: '#1E1E1E',
    paddingTop: 64,
  },
  section: { paddingHorizontal: 20, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#27D969', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0B0B0B', fontWeight: '800' },
  userName: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  plan: { color: '#B9B9B9', fontSize: 13, marginTop: 2 },
  separator: { height: 1, backgroundColor: '#1E1E1E', marginVertical: 12 },
  item: { paddingHorizontal: 20, paddingVertical: 14 },
  itemPressed: { backgroundColor: '#111111' },
  itemText: { color: '#ECEDEE', fontSize: 16 },
});



import { auth, db } from '@/services/firebase';
import { useRouter } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  drawerWidth?: number; // px, optional override
  plan?: 'Free' | 'Pro';
};

export const SideDrawer: React.FC<Props> = ({ isOpen, onClose, drawerWidth, plan = 'Free' }) => {
  const router = useRouter();
  const user = auth.currentUser;
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial position off-screen
  const initialWidth = drawerWidth ?? (SCREEN_WIDTH * 0.84);
  const translateX = useRef(new Animated.Value(-initialWidth)).current;
  const measuredWidthRef = useRef(initialWidth);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            const subscriptionWarning = plan === 'Pro'
              ? '\n\n⚠️ You have an active Pro subscription. Deleting your account will NOT cancel it automatically — please cancel it manually in Google Play before proceeding.'
              : '';
            Alert.alert(
              'Final Confirmation',
              `All your data will be permanently deleted. You will not be able to recover your account.${subscriptionWarning}`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    const currentUser = auth.currentUser;
                    if (!currentUser) return;

                    setIsDeleting(true);
                    close();

                    try {
                      await deleteDoc(doc(db, 'users', currentUser.uid));
                      await deleteUser(currentUser);
                      router.replace('/signin');
                    } catch (error: unknown) {
                      setIsDeleting(false);
                      const firebaseError = error as { code?: string };
                      if (firebaseError.code === 'auth/requires-recent-login') {
                        Alert.alert(
                          'Sign in required',
                          'For security reasons, please sign out and sign in again before deleting your account.',
                          [{ text: 'OK' }]
                        );
                      } else {
                        Alert.alert(
                          'Error',
                          'Failed to delete account. Please try again later.',
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
            if (!isOpen) {
               // Update closed position if layout differs from initial guess
               translateX.setValue(-w);
            }
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

          <View style={styles.separator} />

          {/* Delete Account */}
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Text style={[styles.itemText, styles.deleteText]}>
              {isDeleting ? 'Deleting…' : 'Delete Account'}
            </Text>
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
    left: 0,
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
  deleteText: { color: '#F87171' },
});



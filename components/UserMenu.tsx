import { auth } from '@/services/firebase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function UserMenu(): JSX.Element | null {
  const router = useRouter();
  const user = auth.currentUser;
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = (user.displayName || user.email || 'U')
    .split('@')[0]
    .split(/[\.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');

  const toggle = () => setOpen(v => !v);
  const close = () => setOpen(false);

  const handleSettings = () => {
    close();
    router.push('/settings');
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
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={toggle} style={({ pressed }) => [styles.avatar, pressed && styles.pressed] }>
        <Text style={styles.avatarText}>{initials || 'U'}</Text>
      </Pressable>

      {open && (
        <>
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={styles.menu}>
            <Text style={styles.email} numberOfLines={1}>{user.email || user.displayName || 'User'}</Text>
            <Text style={styles.usage} numberOfLines={1}>Usage: server-tracked (FREE up to 5)</Text>
            <Pressable onPress={handleSettings} style={({ pressed }) => [styles.item, pressed && styles.itemPressed] }>
              <Text style={styles.itemText}>Settings</Text>
            </Pressable>
            <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.item, pressed && styles.itemPressed] }>
              <Text style={styles.itemText}>Sign out</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#0f172a', fontWeight: '800' },
  pressed: { opacity: 0.8 },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 200,
    paddingVertical: 8,
  },
  email: { color: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 6 },
  usage: { color: '#94a3b8', paddingHorizontal: 12, paddingBottom: 6, fontSize: 12 },
  item: { paddingHorizontal: 12, paddingVertical: 10 },
  itemPressed: { backgroundColor: '#0b2940' },
  itemText: { color: '#e2e8f0', fontSize: 16 },
});



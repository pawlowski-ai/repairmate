import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { setUserIssueDescription } = useApp();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const baseBottom = Math.max(16, insets.bottom);
  const bottomOffset = useRef(new Animated.Value(baseBottom)).current;
  const ctaHeight = useRef(new Animated.Value(56)).current;

  const placeholders = [
    'Describe your issue…',
    "My washing machine won’t drain water.",
    'Dishwasher leaking water.',
    'Fridge not cooling.',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 180, easing: Easing.linear, useNativeDriver: true }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.linear, useNativeDriver: true }).start();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [fade, placeholders.length]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent as any, (e: any) => {
      const kb = e?.endCoordinates?.height || 0;
      const extra = Platform.OS === 'android' ? 36 : 16; // większy zapas, by nie przycinało CTA
      Animated.parallel([
        Animated.timing(bottomOffset, { toValue: kb + extra, duration: Platform.OS === 'ios' ? (e?.duration || 250) : 0, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(ctaHeight, { toValue: 48, duration: Platform.OS === 'ios' ? (e?.duration || 250) : 150, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      ]).start();
    });
    const hideSub = Keyboard.addListener(hideEvent as any, (e: any) => {
      Animated.parallel([
        Animated.timing(bottomOffset, { toValue: baseBottom, duration: Platform.OS === 'ios' ? (e?.duration || 200) : 0, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.timing(ctaHeight, { toValue: 56, duration: Platform.OS === 'ios' ? (e?.duration || 200) : 150, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      ]).start();
    });
    return () => {
      // @ts-ignore
      showSub.remove();
      // @ts-ignore
      hideSub.remove();
    };
  }, [baseBottom, bottomOffset]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.wrapper}>
        <View style={styles.topZone}>
          <Text style={styles.headerText}>Tell me what’s broken - I’ll guide you step by step.</Text>
        </View>
        <View style={styles.centerZone}>
          <TouchableWithoutFeedback onPress={focusInput}>
            <View style={styles.inputContainer} accessibilityRole="button" accessibilityLabel="Open message input">
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={setValue}
                style={styles.input}
                placeholder={undefined}
                placeholderTextColor="#7A7A7A"
                autoCapitalize="sentences"
                autoCorrect
                keyboardAppearance={Platform.OS === 'ios' ? 'dark' : undefined}
                returnKeyType="send"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(value.length > 0)}
              />
              {value.length === 0 && (
                <Animated.Text pointerEvents="none" style={[styles.placeholder, { opacity: fade }]}>
                  {placeholders[placeholderIndex]}
                </Animated.Text>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.bottomZone} />
        <Animated.View style={[styles.ctaContainer, { bottom: bottomOffset }]}>
          <TouchableOpacity
            disabled={!(isFocused || value.length > 0)}
            activeOpacity={0.9}
            style={[
              styles.cta,
              !(isFocused || value.length > 0) ? styles.ctaDisabled : styles.ctaEnabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start repair"
            onPress={() => {
              const trimmed = value.trim();
              if (!trimmed) return;
              setUserIssueDescription(trimmed);
              router.push('/diagnosis');
            }}
          >
            <Text
              style={[
                styles.ctaText,
                !(isFocused || value.length > 0) ? styles.ctaTextDisabled : styles.ctaTextEnabled,
              ]}
            >
              Start repair
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  wrapper: { flex: 1 },
  topZone: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 24 },
  centerZone: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  bottomZone: { flex: 1 },
  headerText: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  inputContainer: {
    width: '100%',
    maxWidth: 560,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 16,
    right: 16,
    color: '#7A7A7A',
    fontSize: 16,
  },
  ctaContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
  },
  cta: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#1E1E1E',
  },
  ctaEnabled: {
    backgroundColor: '#27D969',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
  },
  ctaTextDisabled: {
    color: '#7A7A7A',
  },
  ctaTextEnabled: {
    color: '#0B0B0B',
  },
});
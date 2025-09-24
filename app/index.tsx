import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

export default function HomeScreen() {
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

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
});
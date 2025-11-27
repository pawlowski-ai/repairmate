import { SideDrawer } from '@/components/SideDrawer';
import { useApp } from '@/context/AppContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Image, Keyboard, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { setUserIssueDescription, setUserIssueImageBase64 } = useApp();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const baseBottom = Math.max(16, insets.bottom);
  const bottomOffset = useRef(new Animated.Value(baseBottom)).current;
  const ctaHeight = useRef(new Animated.Value(56)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const imageBase64Ref = useRef<string | null>(null);

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

  const handleImagePick = async () => {
    Alert.alert('Add photo', 'Choose a photo to help diagnose the issue', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Take Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (perm.status !== 'granted') {
            Alert.alert('Permission required', 'Camera permission is required to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
            imageBase64Ref.current = result.assets[0].base64 || null;
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
            imageBase64Ref.current = result.assets[0].base64 || null;
          }
        },
      },
    ]);
  };

  const clearImage = () => {
    setSelectedImage(null);
    imageBase64Ref.current = null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.wrapper}>
        {/* Hamburger */}
        <View style={styles.hamburgerWrap}>
          <Pressable onPress={() => setDrawerOpen(true)} accessibilityRole="button" accessibilityLabel="Open menu" style={({ pressed }) => [styles.hamburger, pressed && { opacity: 0.8 }]}>
            <View style={styles.hLine} />
            <View style={styles.hLine} />
            <View style={styles.hLine} />
          </Pressable>
        </View>
        <View style={styles.topZone}>
          <Text style={styles.headerText}>Tell me what’s broken - I’ll guide you step by step.</Text>
        </View>
        <View style={styles.centerZone}>
          <TouchableWithoutFeedback onPress={focusInput}>
            <View style={styles.inputContainer} accessibilityRole="button" accessibilityLabel="Open message input">
              {selectedImage && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <Pressable onPress={clearImage} style={styles.removeImageButton}>
                    <Ionicons name="close-circle" size={20} color="#F87171" />
                  </Pressable>
                </View>
              )}
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={setValue}
                style={[styles.input, selectedImage ? styles.inputWithImage : null]}
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
                <Animated.Text pointerEvents="none" style={[styles.placeholder, { opacity: fade }, selectedImage ? styles.placeholderWithImage : null]}>
                  {placeholders[placeholderIndex]}
                </Animated.Text>
              )}
              <Pressable onPress={handleImagePick} style={({ pressed }) => [styles.cameraButton, pressed && { opacity: 0.7 }]}>
                <Ionicons name="camera-outline" size={24} color="#7A7A7A" />
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={styles.bottomZone} />
        <Animated.View style={[styles.ctaContainer, { bottom: bottomOffset }]}>
          <TouchableOpacity
            disabled={!(isFocused || value.length > 0 || selectedImage)}
            activeOpacity={0.9}
            style={[
              styles.cta,
              !(isFocused || value.length > 0 || selectedImage) ? styles.ctaDisabled : styles.ctaEnabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start repair"
            onPress={() => {
              if (!value.trim() && !selectedImage) return;
              setUserIssueDescription(value.trim() || (selectedImage ? 'Image diagnosis' : ''));
              setUserIssueImageBase64(imageBase64Ref.current);
              router.push('/diagnosis');
            }}
          >
            <Text
              style={[
                styles.ctaText,
                !(isFocused || value.length > 0 || selectedImage) ? styles.ctaTextDisabled : styles.ctaTextEnabled,
              ]}
            >
              Start repair
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <View pointerEvents="box-none" style={styles.drawerOverlay}>
          <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} plan={'Free'} />
        </View>
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
  hamburgerWrap: { position: 'absolute', top: 84, left: 12, zIndex: 10 },
  hamburger: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  hLine: { width: 18, height: 2, backgroundColor: '#FFFFFF', marginVertical: 2, borderRadius: 1 },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  inputContainer: {
    width: '100%',
    maxWidth: 560,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 4,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputWithImage: {
    paddingLeft: 8,
  },
  placeholder: {
    position: 'absolute',
    left: 16,
    right: 48,
    color: '#7A7A7A',
    fontSize: 16,
  },
  placeholderWithImage: {
    left: 56,
  },
  previewContainer: {
    width: 40,
    height: 40,
    marginLeft: 4,
    position: 'relative',
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0B0B0B',
    borderRadius: 10,
  },
  cameraButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
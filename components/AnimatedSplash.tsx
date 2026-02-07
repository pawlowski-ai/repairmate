import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

interface AnimatedSplashProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export function AnimatedSplash({ isReady, onAnimationComplete }: AnimatedSplashProps) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);

  const handleAnimationDone = useCallback(() => {
    onAnimationComplete();
  }, [onAnimationComplete]);

  useEffect(() => {
    if (!isReady) return;

    // Hide native splash as soon as JS is ready - our animated splash takes over
    SplashScreen.hideAsync();

    // Start the wordmark animation:
    // 1. Fade in + scale from 0.3 to 1.0 (800ms)
    // 2. Hold for 400ms
    // 3. Fade out (300ms)
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });

    scale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
    });

    // After scale + hold, fade out and signal completion
    fadeOut.value = withDelay(
      1200,
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) {
          runOnJS(handleAnimationDone)();
        }
      })
    );
  }, [isReady]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * fadeOut.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <Image
          source={require('../assets/images/wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    width: 280,
    height: 80,
  },
});

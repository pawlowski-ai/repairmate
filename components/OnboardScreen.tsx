import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { Image, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  image: any;
  title: string;
  subtitle: string;
  dotsIndex: 0 | 1 | 2;
  onPrimaryPress: () => void;
  primaryLabel: string;
  leftLabel?: string;
  onLeftPress?: () => void;
  /**
   * When true, renders a single primary button taking the full content width
   * (used for the last onboarding screen CTA). Defaults to false.
   */
  fullWidthCta?: boolean;
};

export function OnboardScreen(props: Props) {
  const { image, title, subtitle, dotsIndex, onPrimaryPress, primaryLabel, leftLabel, onLeftPress, fullWidthCta } = props;
  const insets = useSafeAreaInsets();
  const { width: vw, height: screenH } = useWindowDimensions();
  const vh = Math.max(0, screenH - insets.top - insets.bottom);

  const t = Math.max(0.92, Math.min(vw / 390, 1.12));
  const containerWidth = Math.min(vw * 0.86, 520);
  const cardWidth = containerWidth;
  const radius = Math.round(Math.max(18, Math.min(vw * 0.06, 28)));
  // Portrait card similar to mockup: height ≈ 1.22 * width, but bounded by viewport height
  const preferredCardH = Math.round(cardWidth * 1.22);
  const minCardH = Math.round(vh * 0.40);
  const maxCardH = Math.round(vh * 0.56);
  const cardHeight = Math.max(minCardH, Math.min(preferredCardH, maxCardH));
  const dotsMarginTop = Math.max(10, Math.min(vh * 0.025, 24));
  const textBlockMarginTop = Math.max(12, Math.min(vh * 0.03, 28));
  const topSpacer = Math.max(16, Math.min(vh * 0.06, 72));
  const bottomPadding = Math.max(24, insets.bottom + 8);

  const titleSize = Math.round(28 * t);
  const titleLH = Math.round(34 * t);
  const subtitleSize = Math.round(16 * t);
  const subtitleLH = Math.round(24 * t);

  const handlePress = async () => {
    Haptics.selectionAsync().catch(() => {});
    onPrimaryPress();
  };

  const dotStyles = useMemo(() => [0, 1, 2].map(i => ({
    key: i,
    style: [styles.dotBase, i === dotsIndex ? styles.dotActive : styles.dotPassive],
  })), [dotsIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? 28 : 36, paddingBottom: bottomPadding }]}>
        <View style={{ height: topSpacer }} />

        <View style={[styles.imageCard, { width: cardWidth, height: cardHeight, borderRadius: radius }]}> 
          <Image source={image} resizeMode="cover" style={styles.image} />
        </View>

        <View style={[styles.dots, { marginTop: dotsMarginTop }]}>
          {dotStyles.map(d => (
            <View key={d.key} style={d.style} />
          ))}
        </View>

        <View style={[styles.textBlock, { width: containerWidth, marginTop: textBlockMarginTop }]}> 
          <Text accessibilityRole="header" style={[styles.title, { fontSize: titleSize, lineHeight: titleLH }]} numberOfLines={2}>{title}</Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleLH }]} numberOfLines={3}>{subtitle}</Text>
        </View>

        <View style={{ flex: 1 }} />

        {(fullWidthCta) ? (
          <TouchableOpacity accessibilityRole="button" onPress={handlePress} activeOpacity={0.9} style={[styles.ctaFull, { width: containerWidth }]}> 
            <Text style={styles.ctaText}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.ctaRow, { width: containerWidth }]}> 
            {leftLabel ? (
              <TouchableOpacity accessibilityRole="button" onPress={() => { Haptics.selectionAsync().catch(() => {}); onLeftPress && onLeftPress(); }} activeOpacity={0.9} style={[styles.ctaSmall, styles.ctaGhost, { width: Math.round(containerWidth / 3) }]}> 
                <Text style={styles.ctaGhostText}>{leftLabel}</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: Math.round(containerWidth / 3) }} />
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity accessibilityRole="button" onPress={handlePress} activeOpacity={0.9} style={[styles.ctaSmall, { width: Math.round(containerWidth / 3) }]}> 
              <Text style={styles.ctaText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, alignItems: 'center' },
  imageCard: {
    overflow: 'hidden',
    backgroundColor: '#0F0F0F',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
    ...Platform.select({ android: { elevation: 6 } })
  },
  image: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: undefined, height: undefined },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dotBase: { width: 8, height: 8, borderRadius: 4 },
  dotPassive: { backgroundColor: '#3A3A3A' },
  dotActive: { backgroundColor: '#27D969' },
  textBlock: { alignItems: 'center' },
  title: { color: '#FFFFFF', fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { marginTop: 12, color: '#B9B9B9', textAlign: 'center' },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  ctaSmall: {
    width: undefined, minWidth: 0, // exact width below
    height: 44, borderRadius: 22, backgroundColor: '#27D969',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    ...Platform.select({ android: { elevation: 4 } })
  },
  ctaFull: {
    height: 44, borderRadius: 22, backgroundColor: '#27D969',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    ...Platform.select({ android: { elevation: 4 } })
  },
  ctaText: { color: '#0B0B0B', fontSize: 16, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  ctaGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2A2A2A' },
  ctaGhostText: { color: '#FFFFFF', fontSize: 16, lineHeight: 20, fontWeight: '600' },
});



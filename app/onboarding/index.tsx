import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { OnboardScreen } from '../../components/OnboardScreen';

const STEPS = [
  {
    image: require('../../graph.assets/1.png'),
    title: "Describe the problem or take a photo",
    subtitle: "Something broken at home or in your car? Just write a few words or snap a picture. That’s all you need to start.",
    primaryLabel: "Next",
    leftLabel: undefined,
    fullWidthCta: false,
  },
  {
    image: require('../../graph.assets/2.png'),
    title: "AI will find the cause",
    subtitle: "Even if you don’t know what’s wrong, MendWise analyzes your description or photo and tells you the most likely issue.",
    primaryLabel: "Next",
    leftLabel: "Back",
    fullWidthCta: false,
  },
  {
    image: require('../../graph.assets/3.png'),
    title: "Fix it yourself with simple steps",
    subtitle: "MendWise gives you clear, step-by-step instructions. Solve problems on your own, avoid expensive service visits, and feel confident doing it.",
    primaryLabel: "Let's get started!",
    leftLabel: undefined,
    fullWidthCta: true,
  }
];

export default function OnboardingIndex() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stepIndex, setStepIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();

  const handleNext = (index: number) => {
    if (index < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.replace('/');
    }
  };

  const handleBack = (index: number) => {
    if (index > 0) {
      flatListRef.current?.scrollToIndex({ index: index - 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setStepIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <View style={{ width, flex: 1 }}>
            <OnboardScreen
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              dotsIndex={index as 0 | 1 | 2}
              primaryLabel={item.primaryLabel}
              leftLabel={item.leftLabel}
              onLeftPress={() => handleBack(index)}
              onPrimaryPress={() => handleNext(index)}
              fullWidthCta={item.fullWidthCta}
            />
          </View>
        )}
      />
    </>
  );
}

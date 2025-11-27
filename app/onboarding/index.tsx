import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { OnboardScreen } from '../../components/OnboardScreen';

const STEPS = [
  {
    image: require('../../graph.assets/onboarding1vfinal.png'),
    title: "Describe the problem or take a photo",
    subtitle: "Something broken at home or in your car? Just write a few words or snap a picture. That’s all you need to start.",
    primaryLabel: "Next",
    leftLabel: undefined,
    fullWidthCta: false,
  },
  {
    image: require('../../graph.assets/onboarding2.webp'),
    title: "AI will find the cause",
    subtitle: "Even if you don’t know what’s wrong, Mendwise analyzes your description or photo and tells you the most likely issue.",
    primaryLabel: "Next",
    leftLabel: "Back",
    fullWidthCta: false,
  },
  {
    image: require('../../graph.assets/onboarding3.webp'),
    title: "Fix it yourself with simple steps",
    subtitle: "Mendwise gives you clear, step-by-step instructions. Solve problems on your own, avoid expensive service visits, and feel confident doing it.",
    primaryLabel: "Let's get started!",
    leftLabel: undefined,
    fullWidthCta: true,
  }
];

export default function OnboardingIndex() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  
  const step = STEPS[stepIndex];

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(prev => prev + 1);
    } else {
      router.replace('/');
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <OnboardScreen
        image={step.image}
        title={step.title}
        subtitle={step.subtitle}
        dotsIndex={stepIndex as 0 | 1 | 2}
        primaryLabel={step.primaryLabel}
        leftLabel={step.leftLabel}
        onLeftPress={stepIndex > 0 ? handleBack : undefined}
        onPrimaryPress={handleNext}
        fullWidthCta={step.fullWidthCta}
      />
    </>
  );
}


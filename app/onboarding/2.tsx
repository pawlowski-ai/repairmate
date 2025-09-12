import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { OnboardScreen } from '../../components/OnboardScreen';

export default function OnboardingTwo() {
  const router = useRouter();
  return (
    <>
      <StatusBar style="light" />
      <OnboardScreen
        image={require('../../graph.assets/onboarding2.webp')}
        title="AI will find the cause"
        subtitle="Even if you don’t know what’s wrong, Mendwise analyzes your description or photo and tells you the most likely issue."
        dotsIndex={1}
        primaryLabel="Next"
        leftLabel="Back"
        onLeftPress={() => router.replace('/onboarding/1')}
        onPrimaryPress={() => router.replace('/onboarding/3')}
      />
    </>
  );
}



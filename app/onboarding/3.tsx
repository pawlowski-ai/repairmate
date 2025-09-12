import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { OnboardScreen } from '../../components/OnboardScreen';

export default function OnboardingThree() {
  const router = useRouter();
  return (
    <>
      <StatusBar style="light" />
      <OnboardScreen
        image={require('../../graph.assets/onboarding3.webp')}
        title="Fix it yourself with simple steps"
        subtitle="Mendwise gives you clear, step-by-step instructions. Solve problems on your own, avoid expensive service visits, and feel confident doing it."
        dotsIndex={2}
        primaryLabel="Let's get started!"
        fullWidthCta
        onPrimaryPress={() => router.replace('/')}
      />
    </>
  );
}



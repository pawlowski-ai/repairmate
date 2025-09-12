import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { OnboardScreen } from '../../components/OnboardScreen';

export default function OnboardingOne() {
  const router = useRouter();
  return (
    <>
      <StatusBar style="light" />
      <OnboardScreen
        image={require('../../graph.assets/onboarding1vfinal.png')}
        title="Describe the problem or take a photo"
        subtitle="Something broken at home or in your car? Just write a few words or snap a picture. That’s all you need to start."
        dotsIndex={0}
        primaryLabel="Next"
        leftLabel={undefined}
        onLeftPress={undefined}
        onPrimaryPress={() => router.replace('/onboarding/2')}
      />
    </>
  );
}



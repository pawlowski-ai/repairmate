
import TetrisLoader from '@/components/TetrisLoader';
import { useApp } from '@/context/AppContext';
import { geminiService } from '@/services/geminiService';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DiagnosisScreen() {
  const router = useRouter();
  const {
    userIssueDescription,
    userIssueImageBase64,
    diagnosisResult,
    setDiagnosisResult,
    isLoading,
    setIsLoading,
    setLoadingMessage,
    setError,
  } = useApp();

  // Guard against duplicate diagnosis calls (dev StrictMode, fast refresh, retry)
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      const key = `${userIssueDescription || ''}|${userIssueImageBase64 || ''}`;
      if (!userIssueDescription && !userIssueImageBase64) {
        setError("No issue provided. Please go back and describe your problem.");
        router.back();
        return;
      }
      if (fetchedKeyRef.current === key) {
        return; // already fetched for this input
      }

      setIsLoading(true);
      setLoadingMessage("Analyzing your issue...");
      setDiagnosisResult(null);

      try {
        const result = await geminiService.diagnoseIssue(
          userIssueDescription,
          userIssueImageBase64
        );
        setDiagnosisResult(result);
        fetchedKeyRef.current = key;
      } catch (err: any) {
        if (__DEV__) {
          console.error(err);
        }
        const msg = String(err?.message || '');
        // Jeśli to LIMIT (402), wrapper już przeniósł do /paywall – nie cofaj ekranu
        if (err?.code === 'LIMIT' || msg.includes('402') || msg.includes('LIMIT')) {
          setIsLoading(false);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to get diagnosis. Please try again.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (!diagnosisResult) {
      fetchDiagnosis();
    }
  }, [userIssueDescription, userIssueImageBase64, diagnosisResult]);

  const handleConfirm = () => {
    if (!diagnosisResult) return;
    router.push('/steps');
  };

  const requestAlternative = async () => {
    if (!userIssueDescription && !userIssueImageBase64) return;
    setIsLoading(true);
    setLoadingMessage("Finding another possible cause...");
    try {
      const alt = await geminiService.diagnoseAlternativeIssue(
        userIssueDescription,
        userIssueImageBase64,
        diagnosisResult?.text
      );
      setDiagnosisResult(alt);
      // Keep fetchedKeyRef the same so further back/forward won't auto-refetch
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (err?.code === 'LIMIT' || msg.includes('402') || msg.includes('LIMIT')) {
        setIsLoading(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to get another diagnosis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading && (
          <View style={styles.centered}>
            <TetrisLoader size="md" speed="normal" showLoadingText loadingText="Diagnosing your problem..." />
          </View>
        )}

        {diagnosisResult && (
          <View style={{ gap: 12 }}>
            <Text style={styles.leadStrong}>Here’s what I think is wrong:</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{diagnosisResult.text}</Text>
            </View>
          </View>
        )}

        {diagnosisResult && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryCta} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); handleConfirm(); }} accessibilityRole="button">
              <Text style={styles.primaryCtaText}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostCta} onPress={requestAlternative} accessibilityRole="button">
              <Text style={styles.ghostCtaText}>Not it — show another diagnosis</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadStrong: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '800', textAlign: 'center' },
  card: {
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#B9B9B9',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    paddingTop: 8,
  },
  primaryCta: { marginTop: 12, height: 56, backgroundColor: '#27D969', borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  primaryCtaText: { color: '#0B0B0B', fontSize: 18, lineHeight: 22, fontWeight: '600', textAlign: 'center', width: '100%' },
  ghostCta: { marginTop: 10, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1E1E1E', backgroundColor: '#0B0B0B' },
  ghostCtaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

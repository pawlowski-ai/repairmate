
import { useApp } from '@/context/AppContext';
import { geminiService } from '@/services/geminiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    handleBackNavigation,
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
        console.error(err);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>&larr; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Diagnosis</Text>

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>{/* loading message from context is already set */}</Text>
          </View>
        )}

        {diagnosisResult && (
          <View>
            <Text style={styles.subtitle}>Here's what I think is wrong:</Text>
            <View style={styles.card}>
              <Text style={styles.cardText}>{diagnosisResult.text}</Text>
            </View>
          </View>
        )}

        {diagnosisResult && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
              <Text style={styles.buttonText}>That Sounds Right, Show Steps</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1e293b' },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
  },
  cardText: {
    color: '#f1f5f9',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#cbd5e1',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

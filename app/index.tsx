import { APP_NAME } from '@/constants';
import { useApp } from '@/context/AppContext';
import { geminiService } from '@/services/geminiService';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { 
    setUserIssueDescription, 
    setUserIssueImageBase64, 
    userIssueImageBase64, 
    decrementFreeMessages, 
    freeMessagesRemaining, 
    setError, 
    isLoading, 
    setIsLoading, 
    setLoadingMessage 
  } = useApp();

  const [text, setText] = useState('');

  const handleChoosePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Lower quality for faster upload
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUserIssueImageBase64(base64);
    }
  };

  const handleGetDiagnosis = async () => {
    if (text.trim() === '') {
      alert("Please describe your problem before continuing.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Validating your query...");

    try {
      const { isRepairQuery } = await geminiService.validateIsRepairQuery(text);

      if (!isRepairQuery) {
        setIsLoading(false);
        alert("RepairMate is a specialist in fixing household and car issues. Please describe a repair problem you're facing.");
        return;
      }
    } catch (error: any) {
      setIsLoading(false);
      const msg = String(error?.message || '');
      if (error?.code === 'LIMIT' || msg.includes('402') || msg.includes('LIMIT')) {
        router.push('/paywall');
        return;
      }
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        router.replace('/signin');
        return;
      }
      console.error("Error validating query:", error);
      alert("Wystąpił błąd podczas komunikacji z AI. Spróbuj ponownie.");
      return;
    }

    // Usuwamy lokalny licznik – o limicie decyduje backend (402 → Paywall)

    setUserIssueDescription(text.trim());
    router.push('/diagnosis');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Your AI-powered repair assistant.</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.label}>Describe the problem you are facing:</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g., My kitchen faucet is dripping constantly..."
            placeholderTextColor="#9ca3af"
            style={styles.textArea}
            multiline
          />

          {userIssueImageBase64 ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: userIssueImageBase64 }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setUserIssueImageBase64(null)} style={styles.removeImageButton}>
                <Text style={styles.removeImageText}>X</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.buttonGhost} onPress={handleChoosePhoto}>
              <Text style={styles.buttonGhostText}>Add a Photo (Optional)</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.button, (isLoading || text.trim() === '') && styles.buttonDisabled]} 
            onPress={handleGetDiagnosis} 
            disabled={isLoading || text.trim() === ''}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Diagnosis</Text>}
          </TouchableOpacity>
          {/* Lokalny licznik usunięty – backend decyduje o limicie */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#0f172a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#f1f5f9',
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonGhost: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: '#cbd5e1',
    fontSize: 16,
  },
  footerText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#94a3b8',
  },
});
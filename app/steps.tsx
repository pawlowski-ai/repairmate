
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Modal, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { geminiService } from '@/services/geminiService';
import { RepairStep, ChatMessage } from '@/types';

export default function StepByStepScreen() {
  const router = useRouter();
  const {
    diagnosisResult,
    repairSteps,
    setRepairSteps,
    isLoading,
    setIsLoading,
    setLoadingMessage,
    setError,
    resetAppState,
    addChatMessage,
    chatMessages,
    setChatMessages,
  } = useApp();

  const [isChatVisible, setChatVisible] = useState(false);
  const [selectedStep, setSelectedStep] = useState<RepairStep | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchSteps = async () => {
      if (!diagnosisResult) {
        router.back();
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Generating repair steps...");

      try {
        const steps = await geminiService.getRepairSteps(diagnosisResult.text);
        setRepairSteps(steps);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to get repair steps.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (!repairSteps) {
      fetchSteps();
    }
  }, [diagnosisResult]);

  const handleStepSelect = (step: RepairStep) => {
    setSelectedStep(step);
    setChatMessages([]); // Clear previous chat
    setChatVisible(true);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedStep) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput, timestamp: new Date() };
    addChatMessage(userMsg);
    setChatInput('');
    setIsSending(true);

    try {
      const aiResponse = await geminiService.getChatResponse(chatInput, selectedStep, chatMessages);
      const aiMsg: ChatMessage = { id: Date.now().toString() + 'ai', sender: 'ai', text: aiResponse, timestamp: new Date() };
      addChatMessage(aiMsg);
    } catch (error) {
      const errorMsg: ChatMessage = { id: Date.now().toString() + 'ai_error', sender: 'ai', text: 'Sorry, something went wrong.', timestamp: new Date() };
      addChatMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const handleDone = () => {
    resetAppState();
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>&larr; Back to Diagnosis</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fix It Step By Step</Text>
        {diagnosisResult && <Text style={styles.subtitle}>For: {diagnosisResult.text.substring(0, 100)}...</Text>}

        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingText}>{useApp().loadingMessage}</Text>
          </View>
        )}

        {repairSteps && (
          <View style={styles.stepsContainer}>
            {repairSteps.map((step, index) => (
              <TouchableOpacity key={step.id} style={styles.card} onPress={() => handleStepSelect(step)}>
                <Text style={styles.cardTitle}>Step {index + 1}: {step.title}</Text>
                <Text style={styles.cardText}>{step.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={styles.buttonText}>All Done!</Text>
        </TouchableOpacity>

        {/* Chat Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isChatVisible}
          onRequestClose={() => setChatVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedStep?.title}</Text>
              <FlatList
                data={chatMessages}
                style={styles.chatArea}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.chatBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={styles.chatText}>{item.text}</Text>
                  </View>
                )}
              />
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ask a follow-up question..."
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendChat} disabled={isSending}>
                  {isSending ? <ActivityIndicator color="#fff"/> : <Text style={styles.sendButtonText}>Send</Text>}
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setChatVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    paddingVertical: 48,
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
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginBottom: 24,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4,
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
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    height: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 16,
  },
  chatArea: {
    flex: 1,
    marginBottom: 16,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#0ea5e9',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
  },
  chatText: {
    color: '#fff',
    fontSize: 16,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#fff',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 20,
    padding: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

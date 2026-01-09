
import TetrisLoader from '@/components/TetrisLoader';
import { useApp } from '@/context/AppContext';
import { geminiService } from '@/services/geminiService';
import { ChatMessage, RepairStep } from '@/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = Math.round(SCREEN_WIDTH * 0.85); // Use integer width for better snapping
const SPACING = Math.round((SCREEN_WIDTH - ITEM_WIDTH) / 2);

export default function StepByStepScreen() {
  const router = useRouter();
  const {
    diagnosisResult,
    repairSteps,
    setRepairSteps,
    isLoading,
    setIsLoading,
    setLoadingMessage,
    loadingMessage,
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
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Guard against duplicate fetching for the same diagnosis
  const fetchedDiagnosisRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchSteps = async () => {
      if (!diagnosisResult || !diagnosisResult.text) {
        router.back();
        return;
      }

      // Skip if we've already fetched steps for this exact diagnosis text
      if (fetchedDiagnosisRef.current === diagnosisResult.text) {
        return;
      }

      setIsLoading(true);
      setLoadingMessage("Generating repair steps...");

      try {
        const steps = await geminiService.getRepairSteps(diagnosisResult.text);
        setRepairSteps(steps);
        fetchedDiagnosisRef.current = diagnosisResult.text;
      } catch (err: any) {
        if (__DEV__) {
          console.error(err);
        }
        const msg = String(err?.message || '');
        // Jeśli to LIMIT (402), wrapper już nawigował do /paywall – nie cofaj ekranu
        if (err?.code === 'LIMIT' || msg.includes('402') || msg.includes('LIMIT')) {
          setIsLoading(false);
          return;
        }
        // Inne błędy – pokaż błąd i wróć
        setError(err instanceof Error ? err.message : "Failed to get repair steps.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (!repairSteps) {
      fetchSteps();
    }
  }, [diagnosisResult?.text, repairSteps]);

  const handleStepSelect = (step: RepairStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    resetAppState();
    // Wróć bezpośrednio do głównego ekranu (formularz z promptem)
    router.replace('/');
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<RepairStep> | null>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.title}>Steps to fix it</Text>
        {/* Subtitle removed */}

        {isLoading && (
          <View style={styles.centered}>
            <TetrisLoader size="md" speed="normal" showLoadingText loadingText={loadingMessage || 'Generating repair steps...'} />
          </View>
        )}

        {repairSteps && (
          <>
            <FlatList
              ref={flatListRef}
              data={repairSteps}
              keyExtractor={(item) => item.id}
              horizontal
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              ListHeaderComponent={<View style={{ width: SPACING }} />}
              ListFooterComponent={<View style={{ width: SPACING }} />}
              showsHorizontalScrollIndicator={false}
              onScrollBeginDrag={() => setShowSwipeHint(false)}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              renderItem={({ item, index }) => (
                <View style={[styles.page, { width: ITEM_WIDTH }]}> 
                  <View style={styles.pageContent}>
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.cardText}>{item.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.ghostButton}
                      onPress={() => handleStepSelect(item)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.ghostButtonText}>Ask about this step</Text>
                    </TouchableOpacity>
                    {index === repairSteps.length - 1 && (
                      <TouchableOpacity style={styles.button} onPress={handleDone} accessibilityRole="button">
                        <Text style={styles.buttonText}>All Done!</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />

            {showSwipeHint && (
              <View style={styles.swipeHint}>
                <Ionicons name="hand-left-outline" size={20} color="#B9B9B9" />
                <Text style={styles.swipeHintText}>Swipe for next step</Text>
              </View>
            )}

            <View style={styles.indicatorContainer}>
              {repairSteps.map((_, i) => (
                <View key={i} style={[styles.indicatorDot, i === currentIndex && styles.indicatorDotActive]} />
              ))}
            </View>
          </>
        )}

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
                  placeholderTextColor="#B9B9B9"
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: {
    flex: 1,
    paddingTop: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#FFFFFF',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#B9B9B9',
    marginTop: 8,
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  page: {
    paddingHorizontal: 6, // Mały odstęp między kartami
  },
  pageContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1F1F1F',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#27D969',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#0B0B0B',
    fontWeight: '800',
    fontSize: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  cardText: {
    color: '#CFCFCF',
    fontSize: 16,
    lineHeight: 24,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  swipeHintText: {
    color: '#B9B9B9',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 16,
    color: '#B9B9B9',
    fontSize: 16,
  },
  button: {
    height: 56,
    backgroundColor: '#27D969',
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#0B0B0B',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ghostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: 24,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E1E1E',
  },
  indicatorDotActive: {
    backgroundColor: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0B0B0B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    height: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#1E1E1E',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    alignSelf: 'flex-start',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#1E1E1E',
    paddingTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    marginRight: 8,
  },
  sendButton: {
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView source={{ uri: 'https://mendwise.app/privacy.html' }} style={{ flex: 1 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
});



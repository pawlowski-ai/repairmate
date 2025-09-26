import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <WebView source={{ uri: 'https://mendwise.app/terms.html' }} style={{ flex: 1 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
});



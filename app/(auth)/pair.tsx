/**
 * Pair Screen
 * Connect with partner to start co-parenting
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BACKGROUND, PRIMARY, NEUTRAL } from '@/constants/colors';
import { generatePairingCode, isValidPairingCode } from '@/lib/utils';

export default function PairScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tab === 'create') {
      // Generate a pairing code
      const code = generatePairingCode();
      setPairingCode(code);
    }
  }, [tab]);

  const handleCopy = () => {
    // Copy to clipboard
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!isValidPairingCode(inputCode)) {
      // Show error
      return;
    }
    // Validate and join
    console.log('Joining with code:', inputCode);
    router.replace('/(tabs)');
  };

  const handleSkip = () => {
    // Continue without pairing for now
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: BACKGROUND.light }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find your partner</Text>
          <Text style={styles.subtitle}>
            Connect with your significant other to care for your pet together
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'create' && styles.tabActive]}
            onPress={() => setTab('create')}
          >
            <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>
              Create Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'join' && styles.tabActive]}
            onPress={() => setTab('join')}
          >
            <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>
              Join with Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Code Tab */}
        {tab === 'create' && (
          <Animated.View entering={FadeIn}>
            <Card variant="elevated" padding={32} style={styles.card}>
              <Text style={styles.cardTitle}>Your Pairing Code</Text>
              <Text style={styles.cardSubtitle}>
                Share this code with your partner
              </Text>

              <View style={styles.codeContainer}>
                <Text style={styles.code}>{pairingCode || 'XXX-XXX'}</Text>
              </View>

              <Button
                title={copied ? 'Copied!' : 'Copy Code'}
                onPress={handleCopy}
                fullWidth
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Send this code to your partner. They'll enter it on their device
                  to connect with you.
                </Text>
              </View>
            </Card>

            <Text style={styles.waitingText}>
              Waiting for partner to join...
            </Text>
          </Animated.View>
        )}

        {/* Join with Code Tab */}
        {tab === 'join' && (
          <Animated.View entering={FadeIn}>
            <Card variant="elevated" padding={32} style={styles.card}>
              <Text style={styles.cardTitle}>Enter Partner's Code</Text>
              <Text style={styles.cardSubtitle}>
                Ask your partner for their pairing code
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="XXX-XXX"
                  placeholderTextColor={NEUTRAL[400]}
                  value={inputCode}
                  onChangeText={(text: string) => {
                    // Auto-format
                    const formatted = text
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, '')
                      .replace(/(\w{3})/, '$1-')
                      .slice(0, 7);
                    setInputCode(formatted);
                  }}
                  maxLength={7}
                  textAlign="center"
                />
              </View>

              <Button
                title="Join"
                onPress={handleJoin}
                disabled={!isValidPairingCode(inputCode)}
                fullWidth
              />
            </Card>
          </Animated.View>
        )}

        {/* Skip for now */}
        <TouchableOpacity onPress={handleSkip} style={styles.skip}>
          <Text style={styles.skipText}>
            Skip for now →
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const TextInput = require('react-native').TextInput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#615E57',
    lineHeight: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: NEUTRAL[100],
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: NEUTRAL[500],
  },
  tabTextActive: {
    color: '#1A1A2E',
    fontWeight: '600',
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: NEUTRAL[500],
    marginBottom: 24,
  },
  codeContainer: {
    backgroundColor: NEUTRAL[100],
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  code: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 4,
  },
  infoBox: {
    backgroundColor: '#A7C7E7' + '30',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: NEUTRAL[600],
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: NEUTRAL[100],
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  input: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  waitingText: {
    textAlign: 'center',
    fontSize: 15,
    color: NEUTRAL[500],
  },
  skip: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    fontSize: 15,
    color: NEUTRAL[400],
  },
});

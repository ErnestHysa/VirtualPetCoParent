/**
 * Settings Screen
 * App settings and customization options
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUIStore, useAuthStore } from '@/stores';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACKGROUND, NEUTRAL, PRIMARY } from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    theme,
    setTheme,
    reduceMotion,
    setReduceMotion,
    hapticFeedback,
    setHapticFeedback,
    signOut,
  } = useUIStore();
  const { user, partner } = useAuthStore();
  const { colorScheme } = useUIStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/signup');
  };

  const settingsGroups = [
    {
      title: 'Appearance',
      items: [
        {
          label: 'Dark Mode',
          type: 'toggle',
          value: colorScheme === 'dark',
          onValueChange: (value: boolean) => setTheme(value ? 'dark' : 'light'),
        },
        {
          label: 'Reduce Motion',
          type: 'toggle',
          value: reduceMotion,
          onValueChange: setReduceMotion,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          label: 'Haptic Feedback',
          type: 'toggle',
          value: hapticFeedback,
          onValueChange: setHapticFeedback,
        },
        {
          label: 'Care Reminders',
          type: 'toggle',
          value: true,
          onValueChange: () => {},
        },
        {
          label: 'Partner Actions',
          type: 'toggle',
          value: true,
          onValueChange: () => {},
        },
      ],
    },
    {
      title: 'Partner',
      items: [
        {
          label: 'Partner Code',
          type: 'navigation',
          value: partner ? 'Connected' : 'Not connected',
          onPress: () => router.push('/(auth)/pair'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Profile',
          type: 'navigation',
          value: user?.username || '',
          onPress: () => {},
        },
        {
          label: 'Sign Out',
          type: 'action',
          onPress: handleSignOut,
          danger: true,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn}>
        <Text style={[styles.title, { color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800] }]}>
          Settings
        </Text>

        {/* User Card */}
        <Card variant="elevated" padding={20} style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: PRIMARY.rose + '30' }]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
                {user?.username || 'Guest'}
              </Text>
              <Text style={[styles.userEmail, { color: NEUTRAL[500] }]}>
                {user?.email || ''}
              </Text>
            </View>
          </View>
          {partner && (
            <View style={styles.partnerRow}>
              <Text style={[styles.partnerLabel, { color: NEUTRAL[500] }]}>
                💕 Partnered with {partner.username}
              </Text>
            </View>
          )}
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.settingsGroup}>
            <Text style={[styles.groupTitle, { color: NEUTRAL[500] }]}>
              {group.title}
            </Text>
            <Card variant="bordered" padding={0}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.onPress}
                  disabled={item.type === 'toggle'}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.settingItem,
                      itemIndex < group.items.length - 1 && styles.settingItemBorder,
                      { borderColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[200] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: item.danger ? '#FF9AA2' : colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.type === 'toggle' ? (
                      <Switch
                        value={item.value as boolean}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: NEUTRAL[300], true: PRIMARY.rose }}
                        thumbColor="#FFFFFF"
                      />
                    ) : item.type === 'navigation' ? (
                      <View style={styles.settingValue}>
                        <Text style={[styles.settingValueText, { color: NEUTRAL[400] }]}>
                          {item.value as string}
                        </Text>
                        <Text style={styles.settingArrow}>→</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <Card variant="glass" padding={16} style={styles.infoCard}>
          <Text style={[styles.appName, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
            Virtual Pet Co-Parent
          </Text>
          <Text style={[styles.appVersion, { color: NEUTRAL[400] }]}>
            Version 1.0.0 • Made with 💕
          </Text>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  userCard: {
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  partnerRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: NEUTRAL[200],
  },
  partnerLabel: {
    fontSize: 14,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValueText: {
    fontSize: 14,
  },
  settingArrow: {
    fontSize: 16,
    color: NEUTRAL[300],
  },
  infoCard: {
    marginTop: 8,
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
  },
});

/**
 * Tabs Layout
 * Main tab navigation with beautiful custom tab bar
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { useUIStore } from '@/stores';
import { BACKGROUND, NEUTRAL } from '@/constants/colors';

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  care: '💕',
  games: '🎮',
  settings: '⚙️',
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  care: 'Care',
  games: 'Games',
  settings: 'Settings',
};

export default function TabsLayout() {
  const { colorScheme } = useUIStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light,
          borderTopColor: colorScheme === 'dark' ? NEUTRAL[700] : NEUTRAL[200],
          borderTopWidth: 1,
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#E8B4B8',
        tabBarInactiveTintColor: NEUTRAL[400],
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color }: any) => {
          const routeName = focused ? color : '';
          return (
            <View style={[
              styles.iconContainer,
              focused && styles.iconContainerFocused,
            ]}>
              <Text style={styles.icon}>{TAB_ICONS[routeName] || '📱'}</Text>
            </View>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Text style={styles.icon}>{TAB_ICONS.index}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Text style={styles.icon}>{TAB_ICONS.care}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Text style={styles.icon}>{TAB_ICONS.games}</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
              <Text style={styles.icon}>{TAB_ICONS.settings}</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconContainerFocused: {
    backgroundColor: '#E8B4B8' + '30',
  },
  icon: {
    fontSize: 22,
  },
});

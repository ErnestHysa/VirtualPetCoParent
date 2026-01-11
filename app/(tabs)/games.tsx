/**
 * Games Screen
 * Mini-games for interacting with your pet
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGameStore, useAuthStore, useUIStore } from '@/stores';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACKGROUND, NEUTRAL, PRIMARY } from '@/constants/colors';
import { MINI_GAMES, SCORE_THRESHOLDS } from '@/constants/games';

export default function GamesScreen() {
  const router = useRouter();
  const { colorScheme } = useUIStore();
  const { partner } = useAuthStore();
  const { highScores, totalGamesPlayed } = useGameStore();

  const handleStartGame = (gameType: keyof typeof MINI_GAMES) => {
    router.push(`/games/${gameType}`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? BACKGROUND.dark : BACKGROUND.light }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colorScheme === 'dark' ? NEUTRAL[100] : NEUTRAL[800] }]}>
              Mini Games
            </Text>
            <Text style={[styles.subtitle, { color: NEUTRAL[500] }]}>
              Play to earn XP and make your pet happier!
            </Text>
          </View>
        </View>

        {/* Stats Bar */}
        <Card variant="glass" padding={16} style={styles.statsBar}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: PRIMARY.rose }]}>{totalGamesPlayed}</Text>
              <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Games Played</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: PRIMARY.lavender }]}>{partner ? 'Yes' : 'No'}</Text>
              <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Partner Online</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: PRIMARY.sky }]}>🎮</Text>
              <Text style={[styles.statLabel, { color: NEUTRAL[500] }]}>Co-op Ready</Text>
            </View>
          </View>
        </Card>

        {/* Games List */}
        <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
          Available Games
        </Text>

        {(Object.entries(MINI_GAMES) as Array<[string, typeof MINI_GAMES[keyof typeof MINI_GAMES]]>).map(([key, game], index) => {
          const highScore = highScores[key as keyof typeof highScores] || 0;
          const rank = highScore >= SCORE_THRESHOLDS.platinum
            ? '💎'
            : highScore >= SCORE_THRESHOLDS.gold
            ? '🥇'
            : highScore >= SCORE_THRESHOLDS.silver
            ? '🥈'
            : highScore >= SCORE_THRESHOLDS.bronze
            ? '🥉'
            : null;

          return (
            <Animated.View
              key={key}
              entering={FadeInDown.delay(index * 100)}
            >
              <TouchableOpacity onPress={() => handleStartGame(key as keyof typeof MINI_GAMES)}>
                <Card variant="elevated" padding={20} style={styles.gameCard}>
                  <View style={styles.gameHeader}>
                    <View style={[styles.gameIcon, { backgroundColor: game.color + '30' }]}>
                      <Text style={styles.gameEmoji}>{game.icon}</Text>
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={[styles.gameTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
                        {game.name}
                        {rank && <Text style={styles.rank}> {rank}</Text>}
                      </Text>
                      <Text style={[styles.gameDescription, { color: NEUTRAL[500] }]}>
                        {game.description}
                      </Text>
                      <View style={styles.gameMeta}>
                        <View style={styles.metaTag}>
                          <Text style={[styles.metaText, { color: NEUTRAL[500] }]}>⏱️ {game.duration}s</Text>
                        </View>
                        <View style={styles.metaTag}>
                          <Text style={[styles.metaText, { color: NEUTRAL[500] }]}>
                            {game.cooperative ? '👥 Co-op' : '👤 Solo'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.highScore}>
                      <Text style={[styles.highScoreLabel, { color: NEUTRAL[400] }]}>Best</Text>
                      <Text style={[styles.highScoreValue, { color: game.color }]}>{highScore}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Co-op Bonus Card */}
        {partner && (
          <Card variant="bordered" padding={20} style={styles.coopCard}>
            <View style={styles.coopHeader}>
              <Text style={styles.coopEmoji}>💕</Text>
              <View style={styles.coopInfo}>
                <Text style={[styles.coopTitle, { color: colorScheme === 'dark' ? NEUTRAL[200] : NEUTRAL[700] }]}>
                  Co-op Bonus Active!
                </Text>
                <Text style={[styles.coopDescription, { color: NEUTRAL[500] }]}>
                  Play together with {partner.username || 'your partner'} for 1.5x XP
                </Text>
              </View>
            </View>
          </Card>
        )}
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
  },
  statsBar: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: NEUTRAL[200],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  gameCard: {
    marginBottom: 12,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  gameEmoji: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  rank: {
    fontSize: 16,
  },
  gameDescription: {
    fontSize: 14,
    color: NEUTRAL[500],
    marginBottom: 8,
  },
  gameMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaTag: {
    backgroundColor: NEUTRAL[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  highScore: {
    alignItems: 'center',
    marginLeft: 12,
  },
  highScoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  highScoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  coopCard: {
    marginTop: 8,
    backgroundColor: PRIMARY.rose + '15',
  },
  coopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coopEmoji: {
    fontSize: 32,
  },
  coopInfo: {
    flex: 1,
  },
  coopTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  coopDescription: {
    fontSize: 14,
  },
});

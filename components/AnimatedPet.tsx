import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Svg, Circle, Ellipse, Path, G } from 'react-native-svg';
import { colors } from '../constants/designTokens';
import { PetSpecies, PetColor } from '../stores/onboardingStore';

export interface AnimatedPetProps {
  species: PetSpecies;
  color: PetColor;
  size?: number;
  emotion?: 'happy' | 'sleeping' | 'excited' | 'waiting';
  testID?: string;
}

const colorMap: Record<PetColor, string> = {
  rose: colors.primary.rose,
  lavender: colors.primary.lavender,
  sky: colors.primary.sky,
  mint: colors.semantic.energy,
  sunset: colors.semantic.hunger,
  ocean: '#7EC8E3',
};

export const AnimatedPet: React.FC<AnimatedPetProps> = ({
  species,
  color,
  size = 120,
  emotion = 'happy',
  testID,
}) => {
  const bounce = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (emotion === 'happy') {
      bounce.value = withRepeat(
        withSequence(
          withSpring(1, { damping: 3 }),
          withSpring(0, { damping: 3 })
        ),
        -1,
        false
      );
    } else if (emotion === 'excited') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (emotion === 'sleeping') {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else if (emotion === 'waiting') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }

    return () => {
      bounce.value = 0;
      rotation.value = 0;
      scale.value = 1;
      breathe.value = 1;
    };
  }, [emotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value * -10 },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value * breathe.value },
    ],
  }));

  const renderPet = () => {
    const petColor = colorMap[color];

    switch (species) {
      case 'dragon':
        return (
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <G animatedProps={animatedStyle}>
              {/* Body */}
              <Ellipse cx={60} cy={70} rx={35} ry={30} fill={petColor} opacity={0.9} />
              {/* Head */}
              <Circle cx={60} cy={40} r={25} fill={petColor} />
              {/* Eyes */}
              <Circle cx={50} cy={35} r={5} fill="#1A1A2E" />
              <Circle cx={70} cy={35} r={5} fill="#1A1A2E" />
              {/* Eye highlights */}
              <Circle cx={52} cy={33} r={2} fill="#FFFFFF" />
              <Circle cx={72} cy={33} r={2} fill="#FFFFFF" />
              {/* Smile */}
              <Path
                d="M 50 48 Q 60 56 70 48"
                stroke="#1A1A2E"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
              {/* Wings */}
              <Path
                d="M 25 55 Q 15 45 20 35"
                stroke={petColor}
                strokeWidth={4}
                fill="none"
                opacity={0.7}
              />
              <Path
                d="M 95 55 Q 105 45 100 35"
                stroke={petColor}
                strokeWidth={4}
                fill="none"
                opacity={0.7}
              />
              {/* Horns */}
              <Path
                d="M 40 20 L 35 8"
                stroke={petColor}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <Path
                d="M 80 20 L 85 8"
                stroke={petColor}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        );

      case 'cat':
        return (
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <G animatedProps={animatedStyle}>
              {/* Body */}
              <Ellipse cx={60} cy={75} rx={30} ry={28} fill={petColor} opacity={0.9} />
              {/* Head */}
              <Circle cx={60} cy={42} r={28} fill={petColor} />
              {/* Ears */}
              <Path
                d="M 38 25 L 32 10 L 48 20"
                fill={petColor}
                stroke={petColor}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d="M 82 25 L 88 10 L 72 20"
                fill={petColor}
                stroke={petColor}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Eyes */}
              <Ellipse cx={48} cy={40} rx={6} ry={8} fill="#1A1A2E" />
              <Ellipse cx={72} cy={40} rx={6} ry={8} fill="#1A1A2E" />
              {/* Eye highlights */}
              <Circle cx={50} cy={37} r={2.5} fill="#FFFFFF" />
              <Circle cx={74} cy={37} r={2.5} fill="#FFFFFF" />
              {/* Nose */}
              <Path
                d="M 58 50 L 62 50 L 60 54 Z"
                fill="#FFB5A7"
              />
              {/* Mouth */}
              <Path
                d="M 60 54 Q 55 58 52 56"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d="M 60 54 Q 65 58 68 56"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
              {/* Whiskers */}
              <Path
                d="M 30 50 L 45 52"
                stroke="#1A1A2E"
                strokeWidth={1.5}
                opacity={0.4}
                strokeLinecap="round"
              />
              <Path
                d="M 30 56 L 45 56"
                stroke="#1A1A2E"
                strokeWidth={1.5}
                opacity={0.4}
                strokeLinecap="round"
              />
              <Path
                d="M 90 50 L 75 52"
                stroke="#1A1A2E"
                strokeWidth={1.5}
                opacity={0.4}
                strokeLinecap="round"
              />
              <Path
                d="M 90 56 L 75 56"
                stroke="#1A1A2E"
                strokeWidth={1.5}
                opacity={0.4}
                strokeLinecap="round"
              />
              {/* Tail */}
              <Path
                d="M 90 75 Q 105 65 100 50"
                stroke={petColor}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          </Svg>
        );

      case 'fox':
        return (
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <G animatedProps={animatedStyle}>
              {/* Body */}
              <Ellipse cx={60} cy={75} rx={32} ry={26} fill={petColor} opacity={0.9} />
              {/* Tail */}
              <Ellipse cx={95} cy={75} rx={18} ry={10} fill={petColor} transform="rotate(-20 95 75)" />
              <Ellipse cx={100} cy={73} rx={6} ry={6} fill="#FFFFFF" opacity={0.8} />
              {/* Head */}
              <Circle cx={60} cy={42} r={26} fill={petColor} />
              {/* Ears */}
              <Path
                d="M 35 28 L 30 5 L 50 22"
                fill={petColor}
                stroke={petColor}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d="M 85 28 L 90 5 L 70 22"
                fill={petColor}
                stroke={petColor}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* Inner ears */}
              <Path
                d="M 38 25 L 35 12 L 48 22"
                fill="#FFFFFF"
                opacity={0.5}
              />
              <Path
                d="M 82 25 L 85 12 L 72 22"
                fill="#FFFFFF"
                opacity={0.5}
              />
              {/* Face markings */}
              <Ellipse cx={60} cy={52} rx={12} ry={10} fill="#FFFFFF" opacity={0.7} />
              {/* Eyes */}
              <Ellipse cx={50} cy={40} rx={5} ry={6} fill="#1A1A2E" />
              <Ellipse cx={70} cy={40} rx={5} ry={6} fill="#1A1A2E" />
              {/* Eye highlights */}
              <Circle cx={52} cy={38} r={2} fill="#FFFFFF" />
              <Circle cx={72} cy={38} r={2} fill="#FFFFFF" />
              {/* Nose */}
              <Circle cx={60} cy={50} r={3.5} fill="#1A1A2E" />
              {/* Smile */}
              <Path
                d="M 54 56 Q 60 60 66 56"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          </Svg>
        );

      case 'puppy':
        return (
          <Svg width={size} height={size} viewBox="0 0 120 120">
            <G animatedProps={animatedStyle}>
              {/* Body */}
              <Ellipse cx={60} cy={75} rx={32} ry={28} fill={petColor} opacity={0.9} />
              {/* Tail */}
              <Path
                d="M 92 70 Q 105 60 108 75"
                stroke={petColor}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
              />
              {/* Head */}
              <Circle cx={60} cy={40} r={28} fill={petColor} />
              {/* Ears */}
              <Ellipse cx={38} cy={40} rx={10} ry={16} fill={petColor} transform="rotate(-15 38 40)" />
              <Ellipse cx={82} cy={40} rx={10} ry={16} fill={petColor} transform="rotate(15 82 40)" />
              {/* Face patch */}
              <Ellipse cx={60} cy={52} rx={15} ry="12" fill="#FFFFFF" opacity={0.6} />
              {/* Eyes */}
              <Circle cx={50} cy={38} r={5} fill="#1A1A2E" />
              <Circle cx={70} cy={38} r={5} fill="#1A1A2E" />
              {/* Eye highlights */}
              <Circle cx={52} cy={36} r={2} fill="#FFFFFF" />
              <Circle cx={72} cy={36} r={2} fill="#FFFFFF" />
              {/* Eyebrows */}
              <Path
                d="M 44 30 Q 50 28 54 30"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.5}
              />
              <Path
                d="M 66 30 Q 70 28 76 30"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                opacity={0.5}
              />
              {/* Nose */}
              <Ellipse cx={60} cy={50} rx={5} ry={4} fill="#1A1A2E" />
              {/* Tongue */}
              <Ellipse cx={60} cy={60} rx={5} ry={7} fill="#FFB5A7" opacity={0.8} />
              {/* Smile */}
              <Path
                d="M 52 54 Q 60 58 68 54"
                stroke="#1A1A2E"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          </Svg>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Animated.View style={animatedStyle}>
        {renderPet()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

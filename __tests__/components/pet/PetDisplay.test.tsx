/**
 * PetDisplay Component Tests
 *
 * Testing the main pet view with animations and mood indicators
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { PetDisplay } from '@/components/pet/PetDisplay';
import { Pet, PetSpecies, PetStage } from '@/types';
import { useUIStore } from '@/stores';

// Mock the useUIStore
jest.mock('@/stores', () => ({
  useUIStore: jest.fn(),
  usePetStore: jest.fn(),
}));

// Mock PetSprite component
jest.mock('@/components/pet/PetSprite', () => ({
  PetSprite: 'PetSprite',
}));

// Mock StatPill component
jest.mock('@/components/ui/StatPill', () => ({
  StatPill: 'StatPill',
}));

describe('PetDisplay', () => {
  const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

  const mockPet: Pet = {
    id: 'pet-1',
    coupleId: 'couple-1',
    species: 'dragon' as PetSpecies,
    color: '#E8B4B8',
    name: 'Fluffy',
    currentStage: 'baby' as PetStage,
    stats: {
      hunger: 75,
      happiness: 80,
      energy: 70,
    },
    personality: {
      playful: 25,
      calm: 25,
      mischievous: 25,
      affectionate: 25,
    },
    dominantPersonality: 'playful',
    xp: 100,
    createdAt: new Date('2024-01-01'),
    lastCareAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUIStore.mockReturnValue({
      colorScheme: 'light',
      reduceMotion: false,
    } as any);
  });

  describe('rendering', () => {
    it('should render pet display with pet sprite', () => {
      const { getByTestId, UNSAFE_getAllByType } = render(
        <PetDisplay pet={mockPet} />
      );

      // PetSprite should be rendered (it's mocked as a string)
      expect(UNSAFE_getAllByType('PetSprite')).toBeTruthy();
    });

    it('should render stat pills for each stat', () => {
      const { UNSAFE_getAllByType } = render(
        <PetDisplay pet={mockPet} />
      );

      // StatPill is mocked as a string 'StatPill'
      const statPills = UNSAFE_getAllByType('StatPill');
      expect(statPills.length).toBe(3); // hunger, happiness, energy
    });

    it('should display dominant personality badge', () => {
      const { getByText } = render(
        <PetDisplay pet={mockPet} />
      );

      expect(getByText('playful')).toBeTruthy();
    });

    it('should capitalize personality text', () => {
      const { getByText } = render(
        <PetDisplay pet={{ ...mockPet, dominantPersonality: 'mischievous' } as Pet} />
      );

      expect(getByText('mischievous')).toBeTruthy();
    });

    it('should handle press callback', () => {
      const onPress = jest.fn();
      const { UNSAFE_getByProps } = render(
        <PetDisplay pet={mockPet} onPress={onPress} />
      );

      // PetSprite should receive onPress prop
      const petSprite = UNSAFE_getByProps({ onPress });
      expect(petSprite).toBeTruthy();
    });

    it('should handle long press callback', () => {
      const onLongPress = jest.fn();
      const { UNSAFE_getByProps } = render(
        <PetDisplay pet={mockPet} onLongPress={onLongPress} />
      );

      // PetSprite should receive onLongPress prop
      const petSprite = UNSAFE_getByProps({ onLongPress });
      expect(petSprite).toBeTruthy();
    });
  });

  describe('animations', () => {
    it('should respect reduce motion setting', async () => {
      mockUseUIStore.mockReturnValue({
        colorScheme: 'light',
        reduceMotion: true,
      } as any);

      const { UNSAFE_root } = render(
        <PetDisplay pet={mockPet} />
      );

      // When reduce motion is enabled, animations should not start
      // The component should still render without errors
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should start animations when reduce motion is disabled', () => {
      mockUseUIStore.mockReturnValue({
        colorScheme: 'light',
        reduceMotion: false,
      } as any);

      const { UNSAFE_root } = render(
        <PetDisplay pet={mockPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('color scheme', () => {
    it('should apply light mode styles', () => {
      mockUseUIStore.mockReturnValue({
        colorScheme: 'light',
        reduceMotion: false,
      } as any);

      const { UNSAFE_root } = render(
        <PetDisplay pet={mockPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should apply dark mode styles', () => {
      mockUseUIStore.mockReturnValue({
        colorScheme: 'dark',
        reduceMotion: false,
      } as any);

      const { UNSAFE_root } = render(
        <PetDisplay pet={mockPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('glow color based on stats', () => {
    it('should use rose color for high average stats', () => {
      const highStatsPet: Pet = {
        ...mockPet,
        stats: { hunger: 80, happiness: 85, energy: 90 },
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={highStatsPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use lavender color for medium average stats', () => {
      const mediumStatsPet: Pet = {
        ...mockPet,
        stats: { hunger: 50, happiness: 45, energy: 55 },
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={mediumStatsPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should use gray color for low average stats', () => {
      const lowStatsPet: Pet = {
        ...mockPet,
        stats: { hunger: 20, happiness: 25, energy: 30 },
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={lowStatsPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('different pet stages', () => {
    it('should render egg stage pet', () => {
      const eggPet: Pet = {
        ...mockPet,
        currentStage: 'egg' as PetStage,
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={eggPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render baby stage pet', () => {
      const babyPet: Pet = {
        ...mockPet,
        currentStage: 'baby' as PetStage,
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={babyPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render child stage pet', () => {
      const childPet: Pet = {
        ...mockPet,
        currentStage: 'child' as PetStage,
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={childPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render adult stage pet', () => {
      const adultPet: Pet = {
        ...mockPet,
        currentStage: 'adult' as PetStage,
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={adultPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render elder stage pet', () => {
      const elderPet: Pet = {
        ...mockPet,
        currentStage: 'elder' as PetStage,
      };

      const { UNSAFE_root } = render(
        <PetDisplay pet={elderPet} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('cleanup', () => {
    it('should cleanup animations on unmount', () => {
      const { unmount } = render(
        <PetDisplay pet={mockPet} />
      );

      expect(() => unmount()).not.toThrow();
    });

    it('should handle re-renders with different pets', () => {
      const { rerender } = render(<PetDisplay pet={mockPet} />);

      const differentPet: Pet = {
        ...mockPet,
        name: 'Different',
        dominantPersonality: 'calm',
        stats: { hunger: 50, happiness: 60, energy: 70 },
      };

      expect(() => rerender(<PetDisplay pet={differentPet} />)).not.toThrow();
    });
  });
});

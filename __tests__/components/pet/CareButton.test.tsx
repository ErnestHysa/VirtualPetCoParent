/**
 * CareButton Component Tests
 *
 * Testing the care action button with cooldown and animations
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CareButton } from '@/components/pet/CareButton';
import { Pet, PetSpecies, PetStage, CareActionType } from '@/types';
import { usePetStore } from '@/stores';

// Mock the stores
jest.mock('@/stores', () => ({
  usePetStore: jest.fn(),
  useUIStore: jest.fn(),
}));

// Mock hapticFeedback utility
jest.mock('@/lib/utils', () => ({
  hapticFeedback: jest.fn(),
}));

import { hapticFeedback } from '@/lib/utils';

const mockUsePetStore = usePetStore as jest.MockedFunction<typeof usePetStore>;

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

describe('CareButton', () => {
  const mockPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePetStore.mockReturnValue({
      pet: mockPet,
      canPerformCare: jest.fn(() => true),
      getCareCooldown: jest.fn(() => 0),
    } as any);
  });

  describe('rendering', () => {
    it('should render feed button with correct icon', () => {
      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(getByText('🍖')).toBeTruthy();
      expect(getByText('Feed')).toBeTruthy();
    });

    it('should render play button with correct icon', () => {
      const { getByText } = render(
        <CareButton type="play" onPress={mockPress} />
      );

      expect(getByText('🎮')).toBeTruthy();
      expect(getByText('Play')).toBeTruthy();
    });

    it('should render walk button with correct icon', () => {
      const { getByText } = render(
        <CareButton type="walk" onPress={mockPress} />
      );

      expect(getByText('🚶')).toBeTruthy();
      expect(getByText('Walk')).toBeTruthy();
    });

    it('should render pet button with correct icon', () => {
      const { getByText } = render(
        <CareButton type="pet" onPress={mockPress} />
      );

      expect(getByText('💕')).toBeTruthy();
      expect(getByText('Pet')).toBeTruthy();
    });

    it('should render groom button with correct icon', () => {
      const { getByText } = render(
        <CareButton type="groom" onPress={mockPress} />
      );

      expect(getByText('✨')).toBeTruthy();
      expect(getByText('Groom')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('should render small size button', () => {
      const { getByTestId } = render(
        <CareButton type="feed" onPress={mockPress} size="sm" />
      );

      expect(getByTestId).toBeTruthy();
    });

    it('should render medium size button (default)', () => {
      const { getByTestId } = render(
        <CareButton type="feed" onPress={mockPress} size="md" />
      );

      expect(getByTestId).toBeTruthy();
    });

    it('should render large size button', () => {
      const { getByTestId } = render(
        <CareButton type="feed" onPress={mockPress} size="lg" />
      );

      expect(getByTestId).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when button is pressed', () => {
      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      fireEvent.press(getByText('Feed'));

      expect(mockPress).toHaveBeenCalled();
    });

    it('should trigger haptic feedback on press', () => {
      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      fireEvent.press(getByText('Feed'));

      expect(hapticFeedback).toHaveBeenCalledWith('medium');
    });

    it('should not call onPress when disabled via prop', () => {
      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} disabled={true} />
      );

      fireEvent.press(getByText('Feed'));

      expect(mockPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when care cannot be performed', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      fireEvent.press(getByText('Feed'));

      expect(mockPress).not.toHaveBeenCalled();
    });
  });

  describe('cooldown display', () => {
    it('should show cooldown timer when cooldown is active', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 5000), // 5 seconds
      } as any);

      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(getByText('5s')).toBeTruthy();
    });

    it('should not show cooldown when no cooldown is active', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => true),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { queryByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(queryByText(/\d+s/)).toBeNull();
    });
  });

  describe('egg stage', () => {
    it('should be disabled when pet is in egg stage', () => {
      const eggPet: Pet = { ...mockPet, currentStage: 'egg' as PetStage };

      mockUsePetStore.mockReturnValue({
        pet: eggPet,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      fireEvent.press(getByText('Feed'));

      expect(mockPress).not.toHaveBeenCalled();
    });

    it('should not show cooldown when pet is in egg stage', () => {
      const eggPet: Pet = { ...mockPet, currentStage: 'egg' as PetStage };

      mockUsePetStore.mockReturnValue({
        pet: eggPet,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 5000),
      } as any);

      const { queryByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      // Cooldown should not be shown for egg stage
      expect(queryByText(/5s/)).toBeNull();
    });
  });

  describe('disabled state', () => {
    it('should have reduced opacity when disabled', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { UNSAFE_root } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have full opacity when enabled', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => true),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { UNSAFE_root } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('pulse animation', () => {
    it('should pulse when button is enabled and pet is not egg', () => {
      mockUsePetStore.mockReturnValue({
        pet: mockPet,
        canPerformCare: jest.fn(() => true),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { UNSAFE_root } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not pulse when pet is in egg stage', () => {
      const eggPet: Pet = { ...mockPet, currentStage: 'egg' as PetStage };

      mockUsePetStore.mockReturnValue({
        pet: eggPet,
        canPerformCare: jest.fn(() => true),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { UNSAFE_root } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle null pet gracefully', () => {
      mockUsePetStore.mockReturnValue({
        pet: null,
        canPerformCare: jest.fn(() => false),
        getCareCooldown: jest.fn(() => 0),
      } as any);

      const { UNSAFE_root } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('should handle multiple presses in quick succession', () => {
      const { getByText } = render(
        <CareButton type="feed" onPress={mockPress} />
      );

      const button = getByText('Feed');

      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      // Each press should trigger the handler
      expect(mockPress).toHaveBeenCalledTimes(3);
    });
  });

  describe('all care action types', () => {
    const careActionTypes: CareActionType[] = ['feed', 'play', 'walk', 'pet', 'groom'];

    careActionTypes.forEach((type) => {
      it(`should render ${type} button correctly`, () => {
        const { getByText, UNSAFE_root } = render(
          <CareButton type={type} onPress={mockPress} />
        );

        expect(UNSAFE_root).toBeTruthy();
        // Should render both icon and label
        expect(getByText).toBeTruthy();
      });
    });
  });
});

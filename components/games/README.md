# Mini-Games Implementation Guide

## Overview

All mini-games have been implemented with:
- **Reanimated 4** animations throughout
- **Haptic feedback** on every interaction
- **30-second timer** for each game
- **Co-op bonus** system when both partners play
- **Victory/Defeat screens** with score display
- **Play Again** flow
- **Full accessibility** support (one-handed, colorblind-friendly)

## File Structure

```
components/games/
├── GameModal.tsx              # Full-screen game modal with blur backdrop
├── TapToPetGame.tsx          # Rapid tapping game with particles
├── SwipeToGroomGame.tsx      # Directional swipe game with combos
├── RhythmFeedGame.tsx        # Beat-based rhythm game
├── FetchTogetherGame.tsx     # Alternating turn-based game
└── index.ts                  # Exports all games
```

## Usage Example

```tsx
import { TapToPetGame, SwipeToGroomGame, RhythmFeedGame, FetchTogetherGame } from '@/components/games';

function MyComponent() {
  const [gameVisible, setGameVisible] = useState(false);

  const handleGameComplete = (score: number, coOpBonus: boolean) => {
    console.log(`Game complete! Score: ${score}, Co-op Bonus: ${coOpBonus}`);
    setGameVisible(false);
  };

  return (
    <TapToPetGame
      visible={gameVisible}
      onClose={() => setGameVisible(false)}
      onComplete={handleGameComplete}
      partnerPlaying={true} // Enable co-op bonus
    />
  );
}
```

## Game Features

### 1. Tap to Pet (TapToPetGame)
- **Mechanic**: Rapid tapping to fill affection meter
- **Features**:
  - Particle effects (confetti) on each tap
  - "Perfect!" streak indicator (5+ streak)
  - Affection meter with progress bar
  - Target score: 500 points
  - Streak bonus: +2 points per streak level

### 2. Swipe to Groom (SwipeToGroomGame)
- **Mechanic**: Swipe in the direction of arrows
- **Features**:
  - Directional arrows with smooth animations
  - Combo counter for consecutive hits
  - "Perfect", "Good", "Miss" feedback
  - Target score: 400 points
  - Combo bonus: +5 points per combo level

### 3. Rhythm Feed (RhythmFeedGame)
- **Mechanic**: Tap on beat to feed pet
- **Features**:
  - Food bouncing to beat (100 BPM)
  - Beat indicator visualization
  - "Perfect", "Good", "Miss" feedback based on timing
  - Target score: 350 points
  - Streak bonus: +3 points per streak level
  - Timing windows: Perfect (±100ms), Good (±200ms)

### 4. Fetch Together (FetchTogetherGame)
- **Mechanic**: Alternating turns between players
- **Features**:
  - "Your turn!" / "Partner's turn!" indicators
  - Turn timer (3 seconds per turn)
  - Sync bonus for quick consecutive taps
  - Target score: 400 points
  - Streak bonus: +5 points per streak level
  - Sync bonus: Up to +10 points for quick taps

## Props Interface

All games share a common interface:

```tsx
interface GameProps {
  visible: boolean;              // Show/hide game
  onClose: () => void;           // Close callback
  onComplete: (score: number, coOpBonus: boolean) => void;  // Game complete
  partnerPlaying?: boolean;      // Enable co-op bonus
}
```

Additional props for FetchTogetherGame:
```tsx
interface FetchTogetherGameProps extends GameProps {
  isPlayerTurn?: boolean;  // Initial turn (default: true)
}
```

## Scoring System

### Base Points
- Tap to Pet: 10 points per tap
- Swipe to Groom: 25 points per correct swipe
- Rhythm Feed: 30 points (Perfect), 15 points (Good)
- Fetch Together: 20 points per tap

### Bonuses
- **Streak Bonus**: Increases with consecutive successful actions
- **Co-op Bonus**: 1.5x multiplier when partnerPlaying=true and target score reached
- **Sync Bonus** (Fetch Together): Up to +10 points for quick taps

### Victory Conditions
- Tap to Pet: 300+ points
- Swipe to Groom: 400+ points
- Rhythm Feed: 350+ points
- Fetch Together: 400+ points

## Accessibility Features

### One-Handed Play
- All buttons are minimum 44x44pt
- Touchable areas are large and centered
- Swipe gestures work anywhere on screen

### Colorblind Support
- Uses color + text/position for feedback
- High contrast ratios (WCAG AA compliant)
- Symbols and icons supplement color coding

### Screen Reader Support
- Proper accessibility roles and labels
- State announcements (timer, score, turn)
- Semantic HTML structure

## Animation Details

### Game Modal
- Smooth enter/exit with spring animations
- Blur backdrop using expo-blur
- Scale + translate transitions

### In-Game Animations
- **Tap to Pet**: Scale pulse + rotation on tap, particles burst
- **Swipe to Groom**: Arrow rotation, combo pulse, feedback pop
- **Rhythm Feed**: Food bounce (sine wave), target pulse, beat indicator
- **Fetch Together**: Ball float, turn indicator, sync bonus pop

### Reanimated Usage
- `useSharedValue` for animated values
- `useAnimatedStyle` for style transforms
- `withSpring` for physics-based animations
- `withTiming` for precise timing
- `withSequence` for chained animations
- `withRepeat` for looping animations

## Haptic Feedback

Every interaction uses appropriate haptic feedback:
- **Light**: Button presses, small interactions
- **Medium**: Successful actions, scoring
- **Heavy**: Game end, victory
- **Success**: Victory screens
- **Error**: Missed actions, defeat

## Performance Optimizations

- Animations run on native thread (Reanimated)
- Particle systems cleanup after animation
- Timer cleanup on unmount
- Minimal re-renders with proper state management

## Future Enhancements

Potential additions:
- Sound effects (optional, can be toggled)
- Leaderboards
- Daily challenges
- Unlockable pet skins
- Difficulty levels
- More game modes

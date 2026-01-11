# Virtual Pet Co-Parent - Mini-Games Documentation

## Overview
This directory contains 4 polished, accessible mini-games built with React Native Reanimated, featuring haptic feedback, smooth animations, and co-op gameplay support.

## Game List

### 1. Tap to Pet (`TapToPetGame.tsx`)
**Objective**: Tap the pet rapidly to fill the affection meter within 30 seconds.

**Features**:
- Bouncing pet emoji with spring animations
- Progress bar showing affection meter (target: 500 points)
- Heart particles explode on each tap
- Combo streak system with "PERFECT!" popup at 4+ streak
- 30-second countdown timer
- Score display with real-time updates

**Scoring**:
- Base: 10 points per tap
- Streak bonus: +2 points per streak level (max +20)
- Target: 300 points for victory

**Accessibility**:
- One-handed play
- Large touch target (120px)
- Screen reader support
- Clear visual feedback

---

### 2. Swipe to Groom (`SwipeToGroomGame.tsx`)
**Objective**: Swipe in the direction shown by the arrow to groom the pet.

**Features**:
- Random directional arrows (up, down, left, right)
- Smooth rotation animations for arrows
- Combo counter for consecutive correct swipes
- "GREAT!" and "PERFECT!" feedback popups
- Visual combo box with glow effect
- Swipe anywhere on screen

**Scoring**:
- Base: 25 points per correct swipe
- Combo bonus: +5 points per combo level (max +50)
- Target: 400 points for victory

**Controls**:
- Swipe in any direction
- Minimum threshold: 50px
- Timeout: 2 seconds per arrow

**Accessibility**:
- Full-screen swipe detection
- One-handed play
- Clear visual indicators
- Gesture-based (no precise tapping needed)

---

### 3. Rhythm Feed (`RhythmFeedGame.tsx`)
**Objective**: Tap on the beat to feed the pet. Time your taps when the bouncing food is at its largest.

**Features**:
- Pulsing circle shows the beat rhythm (100 BPM)
- Food bounces to the beat
- Timing-based scoring: Perfect, Good, Miss
- Visual beat indicator (animated dot)
- Streak counter for consecutive perfect hits
- Accuracy statistics at end

**Scoring**:
- Perfect (within 100ms of beat): 30 points + streak bonus
- Good (within 200ms of beat): 15 points + streak bonus
- Miss: 0 points, streak reset
- Streak bonus: +3 points per streak level (max +30)
- Target: 350 points for victory

**Timing Windows**:
- Perfect: 100ms
- Good: 200ms
- Miss: anything else

**Accessibility**:
- Visual rhythm indicator
- One-tap gameplay
- Clear timing feedback
- Screen reader friendly

---

### 4. Fetch Together (`FetchTogetherGame.tsx`)
**Objective**: Take turns tapping the ball with your partner to build streaks and sync bonuses.

**Features**:
- Turn-based gameplay ("Your turn!" / "Partner's turn!")
- 3-second turn timer with progress bar
- Sync bonus for quick consecutive taps
- Streak counter for consecutive successful throws
- Ball floating animation
- Player avatars showing whose turn it is

**Scoring**:
- Base: 20 points per successful tap
- Streak bonus: +5 points per streak level (max +25)
- Sync bonus: Up to +10 points for tapping within 500ms of last tap
- Target: 400 points for victory

**Mechanics**:
- Turn duration: 3 seconds
- Sync window: 500ms
- Tapping extends your turn timer

**Co-op Features**:
- Designed for two-player sync
- Visual turn indicators
- Partner avatars
- Co-op bonus notification

**Accessibility**:
- Clear turn indicators
- Large touch targets
- One-handed play
- Turn timer with visual countdown

---

### 5. Game Complete Modal (`GameCompleteModal.tsx`)
**Usage**: Shared results screen shown after any game ends.

**Features**:
- Star rating (1-3 animated stars with stagger effect)
- Performance message (PHENOMENAL, EXCELLENT, GREAT JOB, etc.)
- Final score display with target comparison
- Co-op bonus notification
- Confetti animation for 3-star wins
- "Play Again" and "Done" buttons

**Star Rating**:
- 3 stars: Score >= 120% of target
- 2 stars: Score >= 100% of target
- 1 star: Score >= 80% of target
- 0 stars: Score < 80% of target

**Animations**:
- Staggered star reveals (150ms delay between stars)
- Confetti particles for 3-star wins
- Spring physics for all interactions
- Smooth button slide-in animation

---

## Shared Components

### GameModal
Wrapper modal that provides:
- Animated slide-up presentation
- Countdown timer with warning state (red at 10s)
- Pause/resume functionality
- Blur backdrop
- Safe area support
- Accessible close/pause buttons

---

## Technical Implementation

### Animation Configuration
```typescript
const springConfig = {
  damping: 15,
  stiffness: 150,
};
```

### Haptic Feedback
Uses expo-haptics:
- `light`: Taps, interactions
- `medium`: Button presses
- `heavy`: Important actions
- `success`: Victory, achievements
- `error`: Misses, failures

### Gesture Handling
- Uses react-native-gesture-handler v2
- GestureDetector for swipe gestures
- Proper runOnJS for state updates

### Accessibility
- Minimum touch target: 44px
- Accessibility labels and hints
- Screen reader support
- High contrast colors
- Colorblind-friendly palette

### Co-op Bonus System
All games support co-op bonus:
- Activate when `partnerPlaying` prop is true
- +50% score bonus for meeting target
- Visual notification in results

---

## Usage Example

```typescript
import { TapToPetGame, GameCompleteModal } from './components/games';

function GameScreen() {
  const [showGame, setShowGame] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleGameComplete = (score: number, coOpBonus: boolean) => {
    setFinalScore(score);
    setShowResults(true);
  };

  return (
    <>
      <TapToPetGame
        visible={showGame}
        onClose={() => setShowGame(false)}
        onComplete={handleGameComplete}
        partnerPlaying={true}
      />

      <GameCompleteModal
        visible={showResults}
        score={finalScore}
        targetScore={500}
        stars={3}
        coOpBonus={true}
        onPlayAgain={() => {
          setShowResults(false);
          setShowGame(true);
        }}
        onDone={() => setShowResults(false)}
        gameTitle="Tap to Pet"
      />
    </>
  );
}
```

---

## Design Tokens Used

```typescript
colors.primary.rose      // #E8B4B8 - Primary action color
colors.primary.lavender  // #C5B9CD - Secondary color
colors.primary.sky       // #A7C7E7 - Accent color
colors.semantic.happiness // #FFE58F - Success/perfect feedback
colors.semantic.energy   // #B5EAD7 - Good feedback
colors.text.primary      // #1A1A2E - Main text
colors.text.secondary    // #4A4A5E - Secondary text
```

---

## Performance Considerations

1. **Timer Management**: All timers are properly cleaned up in useEffect returns
2. **Animation Optimization**: Uses useSharedValue for optimal Reanimated performance
3. **Particle Systems**: Particles are removed after animation completes
4. **State Updates**: Minimal state updates, mostly animated values

---

## Future Enhancements

Potential improvements:
- Add difficulty levels (easy/medium/hard)
- Global leaderboards
- Daily challenges
- Achievement system
- More mini-games (memory, pattern matching, etc.)
- Sound effects toggle
- More pet types with unique animations

---

## File Structure

```
components/games/
├── GameModal.tsx           # Shared modal wrapper
├── TapToPetGame.tsx        # Tapping game
├── SwipeToGroomGame.tsx    # Swiping game
├── RhythmFeedGame.tsx      # Rhythm game
├── FetchTogetherGame.tsx   # Co-op turn-based game
├── GameCompleteModal.tsx   # Results screen
├── index.ts                # Export barrel file
└── GAMES_README.md         # This file
```

---

## Testing Checklist

For each game:
- [ ] Game starts and pauses correctly
- [ ] Timer counts down properly
- [ ] Score updates in real-time
- [ ] Haptic feedback works
- [ ] Animations are smooth (60fps)
- [ ] End screen shows correct results
- [ ] Play again resets all state
- [ ] One-handed play is comfortable
- [ ] Accessibility labels are present
- [ ] Co-op bonus activates correctly

---

## Dependencies Required

```json
{
  "react-native-reanimated": "~4.0.0",
  "react-native-gesture-handler": "~2.20.0",
  "expo-haptics": "~14.0.0",
  "expo-linear-gradient": "~14.0.0",
  "expo-blur": "~14.0.0"
}
```

All games are production-ready with polished UX, accessibility support, and satisfying gameplay feel!

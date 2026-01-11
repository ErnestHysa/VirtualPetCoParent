import { PetSpecies, PetStage, PersonalityType } from '@/types/pet';

/**
 * Pet species configurations
 */
export const PET_SPECIES: Record<PetSpecies, {
  name: string;
  emoji: string;
  description: string;
  baseColor: string;
  personalityBias: PersonalityType[];
}> = {
  dragon: {
    name: 'Fluffy Dragon',
    emoji: '🐉',
    description: 'A gentle, playful companion who loves adventure',
    baseColor: '#E8B4B8',
    personalityBias: ['playful', 'mischievous'],
  },
  cat: {
    name: 'Cosmic Cat',
    emoji: '🐱',
    description: 'A calm, mysterious friend with starry fur',
    baseColor: '#C5B9CD',
    personalityBias: ['calm', 'mischievous'],
  },
  fox: {
    name: 'Glowing Fox',
    emoji: '🦊',
    description: 'An affectionate, clever companion',
    baseColor: '#FF9AA2',
    personalityBias: ['affectionate', 'mischievous'],
  },
  puppy: {
    name: 'Classic Puppy',
    emoji: '🐕',
    description: 'A loyal, loving friend for all adventures',
    baseColor: '#FFE58F',
    personalityBias: ['playful', 'affectionate'],
  },
};

/**
 * Available pet colors
 */
export const PET_COLORS = [
  { id: 'default', name: 'Natural', color: '#FFFFFF' },
  { id: 'rose', name: 'Rose Quartz', color: '#E8B4B8' },
  { id: 'lavender', name: 'Lavender Dream', color: '#C5B9CD' },
  { id: 'sky', name: 'Sky Blue', color: '#A7C7E7' },
  { id: 'mint', name: 'Mint Fresh', color: '#B5EAD7' },
  { id: 'peach', name: 'Peach Fuzz', color: '#FFB5A7' },
  { id: 'gold', name: 'Golden Hour', color: '#FFE58F' },
  { id: 'midnight', name: 'Midnight Sparkle', color: '#1A1A2E' },
] as const;

/**
 * Pet stage configurations
 */
export const PET_STAGES: Record<PetStage, {
  name: string;
  description: string;
  daysRequired: number;
  size: number; // Relative size multiplier
  abilities: string[];
}> = {
  egg: {
    name: 'Egg',
    description: 'A glowing egg waiting to hatch',
    daysRequired: 0,
    size: 0.3,
    abilities: ['wiggle'],
  },
  baby: {
    name: 'Baby',
    description: 'Newly hatched and full of wonder',
    daysRequired: 3,
    size: 0.5,
    abilities: ['blink', 'wiggle', 'coo'],
  },
  child: {
    name: 'Child',
    description: 'Growing more curious every day',
    daysRequired: 14,
    size: 0.7,
    abilities: ['blink', 'wiggle', 'bounce', 'emote'],
  },
  teen: {
    name: 'Teen',
    description: 'Developing a unique personality',
    daysRequired: 30,
    size: 0.85,
    abilities: ['blink', 'wiggle', 'bounce', 'emote', 'dance'],
  },
  adult: {
    name: 'Adult',
    description: 'A fully grown companion',
    daysRequired: 60,
    size: 1.0,
    abilities: ['blink', 'wiggle', 'bounce', 'emote', 'dance', 'trick'],
  },
  elder: {
    name: 'Elder',
    description: 'Wise and glowing with ancient magic',
    daysRequired: 100,
    size: 1.1,
    abilities: ['blink', 'wiggle', 'bounce', 'emote', 'dance', 'trick', 'wisdom'],
  },
};

/**
 * Personality descriptions
 */
export const PERSONALITY_DESCRIPTIONS: Record<PersonalityType, {
  name: string;
  description: string;
  behaviors: string[];
  emoji: string;
}> = {
  playful: {
    name: 'Playful',
    description: 'Loves games and adventures',
    behaviors: ['bounces when happy', 'initiates games', 'reacts enthusiastically'],
    emoji: '🎮',
  },
  calm: {
    name: 'Calm',
    description: 'Peaceful and serene',
    behaviors: ['moves slowly', 'sleeps often', 'soothing presence'],
    emoji: '🧘',
  },
  mischievous: {
    name: 'Mischievous',
    description: 'Full of harmless tricks',
    behaviors: ['hides and surprises', 'playful teasing', 'sneaky movements'],
    emoji: '😜',
  },
  affectionate: {
    name: 'Affectionate',
    description: 'Loves cuddles and attention',
    behaviors: ['nuzzles often', 'sad when alone', 'heart animations'],
    emoji: '💕',
  },
};

/**
 * Stat decay rates per hour (simulated)
 */
export const STAT_DECAY = {
  hunger: 2,      // Loses 2 hunger per hour
  happiness: 1.5, // Loses 1.5 happiness per hour
  energy: 1,      // Loses 1 energy per hour
} as const;

/**
 * Care action effectiveness
 */
export const CARE_EFFECTS = {
  feed: { hunger: 20, energy: 5, happiness: 5 },
  play: { hunger: -5, energy: -10, happiness: 25 },
  walk: { hunger: -10, energy: -15, happiness: 15 },
  pet: { hunger: 0, energy: 0, happiness: 10 },
  groom: { hunger: 0, energy: -5, happiness: 15 },
} as const;

/**
 * Care cooldown in milliseconds (5 minutes)
 */
export const CARE_COOLDOWN = 5 * 60 * 1000;

/**
 * XP rewards for actions
 */
export const XP_REWARDS = {
  feed: 10,
  play: 20,
  walk: 15,
  pet: 5,
  groom: 10,
  gameWin: 50,
  coopBonus: 1.5,
  streakBonus: 1.2,
} as const;

/**
 * Daily sweet messages from pet
 */
export const DAILY_MESSAGES = [
  "I dreamed of both of you holding hands!",
  "Today feels like a perfect day for adventures together!",
  "I miss when you both play with me at the same time!",
  "Did you know you two are my favorite humans?",
  "Send some love to [Partner Name] for me?",
  "I love being part of your little family!",
  "Both of you make me the happiest pet!",
  "I made a wish today—for your love to grow stronger!",
  "Can we all have a dance party today?",
  "Every moment with you two is magical!",
];

/**
 * Days required for each evolution stage
 */
export const STAGE_DAY_REQUIREMENTS: Record<PetStage, number> = {
  egg: 0,
  baby: 3,
  child: 14,
  teen: 30,
  adult: 60,
  elder: 100,
};

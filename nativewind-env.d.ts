/**
 * NativeWind v4 TypeScript Declarations
 * Virtual Pet Co-Parent
 */

/// <reference types="nativewind/types" />

/**
 * Theme type declarations matching global.css variables
 */
declare namespace NativeWind {
  interface Theme {
    /**
     * Brand Colors
     */
    rose: string;
    lavender: string;
    sky: string;

    /**
     * Background Colors
     */
    'bg-light': string;
    'bg-dark': string;

    /**
     * Semantic Colors
     */
    hunger: string;
    happiness: string;
    energy: string;

    /**
     * UI Colors
     */
    'glass-light': string;
    'glass-dark': string;
    'border-light': string;
    'border-dark': string;

    /**
     * Spacing - Safe Area Insets
     */
    'safe-top': string;
    'safe-bottom': string;
    'safe-left': string;
    'safe-right': string;

    /**
     * Border Radius
     */
    'radius-xl': string;
    'radius-2xl': string;
    'radius-3xl': string;
  }
}

/**
 * CSS Module declarations for NativeWind
 */
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

/**
 * Global styles import declaration
 */
declare module '*/global.css' {
  const styles: Record<string, string>;
  export default styles;
}

/**
 * Tailwind utility class declarations
 * Extends the standard React Native View props with Tailwind classes
 */
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      className?: string;
    }
  }
}

/**
 * Animation keyframe type declarations
 */
declare namespace Animation {
  type KeyframeName =
    | 'fadeIn'
    | 'fadeInUp'
    | 'fadeInDown'
    | 'scaleIn'
    | 'slideInRight'
    | 'slideInLeft'
    | 'bounce'
    | 'pulse'
    | 'spin'
    | 'petIdle'
    | 'petHappy'
    | 'shake'
    | 'wiggle'
    | 'float'
    | 'glow'
    | 'progress'
    | 'ripple';

  interface AnimationConfig {
    duration?: number;
    delay?: number;
    easing?: string;
  }
}

/**
 * Extended type declarations for custom theme utilities
 */
declare module 'tailwindcss' {
  interface ThemeConfig {
    extend?: {
      colors?: {
        rose?: string;
        lavender?: string;
        sky?: string;
        'bg-light'?: string;
        'bg-dark'?: string;
        hunger?: string;
        happiness?: string;
        energy?: string;
        'glass-light'?: string;
        'glass-dark'?: string;
        'border-light'?: string;
        'border-dark'?: string;
      };
      spacing?: {
        'safe-top'?: string;
        'safe-bottom'?: string;
        'safe-left'?: string;
        'safe-right'?: string;
      };
      borderRadius?: {
        xl?: string;
        '2xl'?: string;
        '3xl'?: string;
      };
      boxShadow?: {
        soft?: string;
        glow?: string;
      };
    };
  }
}

/**
 * TypeScript declarations for utility classes
 */
declare namespace UtilityClasses {
  /**
   * Animation utilities
   */
  type AnimationClass =
    | 'animate-fade-in'
    | 'animate-fade-in-up'
    | 'animate-fade-in-down'
    | 'animate-scale-in'
    | 'animate-slide-in-right'
    | 'animate-slide-in-left'
    | 'animate-bounce'
    | 'animate-pulse'
    | 'animate-spin'
    | 'animate-pet-idle'
    | 'animate-pet-happy'
    | 'animate-shake'
    | 'animate-wiggle'
    | 'animate-float'
    | 'animate-glow';

  /**
   * Glass morphism utilities
   */
  type GlassClass = 'glass';

  /**
   * Shadow utilities
   */
  type ShadowClass = 'shadow-soft' | 'shadow-glow';

  /**
   * Safe area utilities
   */
  type SafeAreaClass =
    | 'safe-area-top'
    | 'safe-area-bottom'
    | 'safe-area-left'
    | 'safe-area-right'
    | 'safe-area-all';

  /**
   * Text utilities
   */
  type TextClass = 'text-display';

  /**
   * Status bar utilities
   */
  type StatusBarClass = 'status-bar-light' | 'status-bar-dark';
}

/**
 * Augment React Native View props with custom utility classes
 */
declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface ImageProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
  }

  interface TouchableOpacityProps {
    className?: string;
    onPressIn?: () => void;
    onPressOut?: () => void;
  }

  interface TouchableHighlightProps {
    className?: string;
    onPressIn?: () => void;
    onPressOut?: () => void;
  }

  interface PressableProps {
    className?: string;
  }
}

/**
 * Export type declarations for use in components
 */
export type {
  Animation,
  AnimationConfig,
  KeyframeName,
  UtilityClasses,
};

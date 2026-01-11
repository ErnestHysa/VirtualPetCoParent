/**
 * Expo App Configuration
 * Defines app metadata, plugins, and EAS build configuration
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export default {
  // App Information
  name: 'Virtual Pet Co-Parent',
  slug: 'virtualpetcoparent',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'virtualpetcoparent',
  userInterfaceStyle: 'automatic',

  // Splash Screen
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#E8B4B8',
  },

  // Asset Bundle Patterns
  assetBundlePatterns: [
    '**/*',
  ],

  // iOS Configuration
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.virtualpet.coparent',
    buildNumber: '1',
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['virtualpetcoparent'],
        },
      ],
      NSCameraUsageDescription: 'This app uses the camera for pet photos.',
      NSPhotoLibraryUsageDescription: 'This app uses photo library for pet avatars.',
      NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },

  // Android Configuration
  android: {
    package: 'com.virtualpet.coparent',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#E8B4B8',
    },
    permissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'SCHEDULE_EXACT_ALARM',
      'USE_EXACT_ALARM',
      'POST_NOTIFICATIONS',
    ],
  },

  // Web Configuration
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },

  // Plugins
  plugins: [
    'expo-secure-store',
    'expo-splash-screen',
    // Note: expo-haptics removed from plugins due to Node.js v24 type stripping issue
    // The module still works when imported in code, just not as a config plugin
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#E8B4B8',
        sounds: ['./assets/notification.wav'],
      },
    ],
    // Note: expo-sensors removed - package not installed and not required for core functionality
    [
      '@sentry/react-native/expo',
      {
        organization: 'virtualpet-coparent',
        project: 'virtual-pet-coparent',
        ...(IS_DEV ? { dryRun: true } : {}),
      },
    ],
  ],

  // Experiments
  experiments: {
    typedRoutes: true,
  },

  // Extra Configuration
  extra: {
    eas: {
      projectId: 'your-project-id-here',
    },
  },

  // Updates
  updates: {
    url: 'https://u.expo.dev/your-project-id',
  },

  // Runtime Version
  runtimeVersion: {
    policy: 'appVersion',
  },

  // EAS Build Configuration
  eas: {
    build: {
      development: {
        developmentClient: true,
        distribution: 'internal',
        android: {
          buildType: 'apk',
        },
        ios: {
          simulator: true,
        },
      },
      preview: {
        distribution: 'internal',
        android: {
          buildType: 'apk',
        },
        ios: {
          simulator: true,
        },
      },
      production: {
        distribution: 'store',
        ios: {
          autoIncrement: true,
          buildConfiguration: 'ios-production.xcconfig',
          entitlements: {
            'aps-environment': 'production',
          },
        },
        android: {
          autoIncrement: true,
          buildType: 'app-bundle',
        },
        env: {
          EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
          EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          SENTRY_DSN: process.env.SENTRY_DSN,
        },
      },
    },
    submit: {
      production: {
        ios: {
          appleId: 'your-apple-id',
          ascAppId: 'your-app-store-connect-app-id',
          appleTeamId: 'your-team-id',
        },
        android: {
          serviceAccountKeyPath: './google-service-account.json',
          track: 'internal',
        },
      },
    },
  },
};

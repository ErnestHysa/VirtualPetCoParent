/**
 * Sentry Configuration
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const IS_DEV = __DEV__ || process.env.NODE_ENV === 'development';

/**
 * Initialize Sentry
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    // Environment
    environment: IS_DEV ? 'development' : 'production',

    // Tracing
    tracesSampleRate: IS_DEV ? 1.0 : 0.2,

    // Session Replay
    replaysSessionSampleRate: IS_DEV ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Performance Monitoring
    enableAutoPerformanceTracking: !IS_DEV,

    // Release
    release: getAppVersion(),
    dist: getAppBuildNumber(),

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        shouldCreateSpanForRequest: (url) => {
          // Don't track Supabase health checks
          return !url.includes('/health');
        },
      }),
      new Sentry.ReactNativeReplay(),
      new Sentry.BrowserTracing(),
    ],

    // beforeSend Filter
    beforeSend(event, hint) => {
      // Filter out expected errors in development
      if (IS_DEV) {
        console.error('Error caught by Sentry:', event, hint);
      }

      // Don't send network errors from Supabase during reconnection
      if (event.exception) {
        const message = event.exception.values?.[0]?.value;
        if (message?.includes('Network request failed')) {
          // Rate limit network errors
          return null;
        }
      }

      return event;
    },

    // Before Send Transaction
    beforeSendTransaction(transaction) {
      // Filter out long-running transactions in production
      if (!IS_DEV && transaction.startTimestamp) {
        const duration = (Date.now() - transaction.startTimestamp) / 1000;
        if (duration > 30) {
          return null;
        }
      }
      return transaction;
    },

    // Attach User Context
    attachUserContext(user: { id: string; email?: string; username?: string } | null) {
      if (user) {
        Sentry.setUser({
          id: user.id,
          email: user.email,
          username: user.username,
        });
      } else {
        Sentry.setUser(null);
      }
    },

    // Attach Pet Context
    attachPetContext(pet: { id: string; species: string; stage: string } | null) {
      if (pet) {
        Sentry.setContext('pet', {
          species: pet.species,
          stage: pet.stage,
        });
        Sentry.setTag('pet_species', pet.species);
        Sentry.setTag('pet_stage', pet.stage);
      } else {
        Sentry.setContext('pet', null);
      }
    },

    // Breadcrumbs
    maxBreadcrumbs: 50,

    // Disabled integrations
    enabled: !IS_DEV || process.env.FORCE_SENTRY === 'true',
  });
}

/**
 * Get app version from package.json
 */
function getAppVersion(): string {
  try {
    return require('./package.json').version;
  } catch {
    return '1.0.0';
  }
}

/**
 * Get app build number
 */
function getAppBuildNumber(): string {
  // This would be updated by EAS during build
  return process.env.EAS_BUILD_ID || '1';
}

/**
 * Capture Error
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    level: 'error',
    extra: context,
  });
}

/**
 * Capture Message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, {
    level,
  });
}

/**
 * Add Breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Performance Monitoring
 */
export function startTransaction(name: string, op: string = 'transaction') {
  return Sentry.startTransaction({ name, op });
}

/**
 * Set User Tag
 */
export function setUserTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Clear User Tags
 */
export function clearUserTags() {
  Sentry.setTags({});
}

// Export Sentry for direct use
export { Sentry };

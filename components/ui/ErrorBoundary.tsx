/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Displays a fallback UI instead of crashing the app
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { BACKGROUND, NEUTRAL, PRIMARY } from '@/constants/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error details in state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    // Reload the app
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // In development, we can try to recover
      // In production, you might want to reload the bundle or restart the app
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😢</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Don't worry, your pet is safe!
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReset}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND.light,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: NEUTRAL[800],
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: NEUTRAL[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: NEUTRAL[100],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: NEUTRAL[700],
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: NEUTRAL[500],
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: PRIMARY.rose,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;

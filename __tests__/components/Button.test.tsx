/**
 * Button Component Tests
 *
 * Testing the Button UI component
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(
      <Button title="Click Me" onPress={() => {}} />
    );

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Press Me" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPressMock} disabled />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders with loading state', () => {
    const { getByText, queryByText } = render(
      <Button title="Loading" onPress={() => {}} loading />
    );

    // Title should not be shown when loading
    expect(queryByText('Loading')).toBeNull();
    // ActivityIndicator would be rendered (but we're not checking for it specifically)
  });

  it('renders different variants', () => {
    const { getByText, rerender } = render(
      <Button title="Primary" onPress={() => {}} variant="primary" />
    );
    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Secondary" onPress={() => {}} variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button title="Outline" onPress={() => {}} variant="outline" />);
    expect(getByText('Outline')).toBeTruthy();
  });

  it('renders different sizes', () => {
    const { getByText, rerender } = render(
      <Button title="Small" onPress={() => {}} size="sm" />
    );
    expect(getByText('Small')).toBeTruthy();

    rerender(<Button title="Medium" onPress={() => {}} size="md" />);
    expect(getByText('Medium')).toBeTruthy();

    rerender(<Button title="Large" onPress={() => {}} size="lg" />);
    expect(getByText('Large')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <Button title="With Icon" onPress={() => {}} icon="⭐" />
    );

    expect(getByText('⭐')).toBeTruthy();
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('renders in fullWidth mode', () => {
    const { getByTestId } = render(
      <Button
        title="Full Width"
        onPress={() => {}}
        fullWidth
        testID="full-width-button"
      />
    );

    const button = getByTestId('full-width-button');
    expect(button).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 20 };
    const { getByTestId } = render(
      <Button
        title="Styled"
        onPress={() => {}}
        style={customStyle}
        testID="styled-button"
      />
    );

    const button = getByTestId('styled-button');
    expect(button).toBeTruthy();
  });
});

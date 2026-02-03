import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/react';
import { TextInput } from '../TextInput';

describe('TextInput - Error Message Layout Stability', () => {
  it('always renders message slot to prevent layout shift', () => {
    render(<TextInput label="Test Input" />);

    // Message slot should always be present
    const messageSlot = document.querySelector('.text-input-message-slot');
    expect(messageSlot).toBeInTheDocument();
  });

  it('message slot has reserved min-height even without error or helper', () => {
    render(<TextInput label="Test Input" />);

    const messageSlot = document.querySelector('.text-input-message-slot');
    expect(messageSlot).toBeInTheDocument();

    // Check that min-height is set
    const styles = window.getComputedStyle(messageSlot!);
    expect(styles.minHeight).toBe('1.25rem');
  });

  it('shows placeholder when no error or helper text', () => {
    render(<TextInput label="Test Input" />);

    const placeholder = document.querySelector('.text-input-message-placeholder');
    expect(placeholder).toBeInTheDocument();

    // Placeholder should be hidden but take up space
    const styles = window.getComputedStyle(placeholder!);
    expect(styles.visibility).toBe('hidden');
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(<TextInput label="Test Input" error={errorMessage} />);

    // Error message should be visible
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Placeholder should not be rendered when error is present
    const placeholder = document.querySelector('.text-input-message-placeholder');
    expect(placeholder).not.toBeInTheDocument();
  });

  it('displays helper text when helperText prop is provided without error', () => {
    const helperText = 'Must be at least 8 characters';
    render(<TextInput label="Test Input" helperText={helperText} />);

    // Helper text should be visible
    expect(screen.getByText(helperText)).toBeInTheDocument();

    // Placeholder should not be rendered when helper is present
    const placeholder = document.querySelector('.text-input-message-placeholder');
    expect(placeholder).not.toBeInTheDocument();
  });

  it('error takes precedence over helper text', () => {
    const errorMessage = 'Invalid input';
    const helperText = 'This is a helper';

    render(
      <TextInput
        label="Test Input"
        error={errorMessage}
        helperText={helperText}
      />
    );

    // Error should be shown
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Helper should not be shown
    expect(screen.queryByText(helperText)).not.toBeInTheDocument();
  });

  it('message slot maintains same container when error appears', () => {
    const { rerender } = render(<TextInput label="Test Input" />);

    const messageSlot = document.querySelector('.text-input-message-slot');
    const initialSlot = messageSlot;

    // Re-render with error
    rerender(<TextInput label="Test Input" error="Error occurred" />);

    // Same container should still be in the DOM
    const updatedSlot = document.querySelector('.text-input-message-slot');
    expect(updatedSlot).toBe(initialSlot);
  });
});

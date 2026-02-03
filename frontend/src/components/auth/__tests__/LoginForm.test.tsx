import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/utils/test-utils';
import { LoginForm } from '../LoginForm';

describe('LoginForm - Error Slot Layout Stability', () => {
  it('always renders error slot container to prevent layout shift', () => {
    const mockOnSubmit = vi.fn();
    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />);

    // Error slot container should always be present
    const errorSlot = document.querySelector('.auth-form-error-slot');
    expect(errorSlot).toBeInTheDocument();
  });

  it('error slot has reserved height even when no error is present', () => {
    const mockOnSubmit = vi.fn();
    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />);

    const errorSlot = document.querySelector('.auth-form-error-slot');
    expect(errorSlot).toBeInTheDocument();

    // Check that min-height is set (reserves space)
    const styles = window.getComputedStyle(errorSlot!);
    expect(styles.minHeight).toBeTruthy();
  });

  it('error slot exists and maintains layout when validation error occurs', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />);

    const errorSlot = document.querySelector('.auth-form-error-slot');
    const initialSlot = errorSlot;

    // Submit form to trigger validation errors
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      // Validation errors should appear in input fields
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    // Error slot container should still be the same element (not re-rendered)
    const updatedSlot = document.querySelector('.auth-form-error-slot');
    expect(updatedSlot).toBe(initialSlot);
  });

  it('shows validation error when submitting with empty email', async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<LoginForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Should show email required error
    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

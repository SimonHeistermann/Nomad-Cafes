import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { TextInput, type TextInputProps } from './TextInput';
import '@/styles/components/forms/password-input.css';

export interface PasswordInputProps extends Omit<TextInputProps, 'type' | 'rightIcon'> {
  /** Initial visibility state */
  showPasswordInitially?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPasswordInitially = false, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(showPasswordInitially);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const toggleButton = (
      <button
        type="button"
        className="password-toggle-button"
        onClick={toggleVisibility}
        disabled={disabled}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    );

    return (
      <TextInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        rightIcon={toggleButton}
        disabled={disabled}
        {...props}
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

import React from 'react';
import { TextInput, TextInputProps } from './TextInput';

export interface PhoneInputProps extends Omit<TextInputProps, 'type' | 'inputMode'> {}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onKeyDown, onChange, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Escape' ||
        e.key === 'Enter'
      ) {
        onKeyDown?.(e);
        return;
      }

      // Allow: Ctrl/Cmd+A, Ctrl/Cmd+C, Ctrl/Cmd+V, Ctrl/Cmd+X
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')
      ) {
        onKeyDown?.(e);
        return;
      }

      // Allow: home, end, left, right arrows
      if (
        e.key === 'Home' ||
        e.key === 'End' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
      ) {
        onKeyDown?.(e);
        return;
      }

      // Allow: numbers, +, -, (, ), space
      const allowedChars = /^[0-9+\-() ]$/;
      if (!allowedChars.test(e.key)) {
        e.preventDefault();
        return;
      }

      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove any non-numeric characters except +, -, (, ), and space
      const value = e.target.value.replace(/[^0-9+\-() ]/g, '');

      // Create a new event with the sanitized value
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onChange?.(newEvent);
    };

    return (
      <TextInput
        ref={ref}
        type="tel"
        inputMode="tel"
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

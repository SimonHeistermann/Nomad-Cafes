import React from 'react';
import '@/styles/components/forms/text-input.css';

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const inputClasses = [
      'text-input',
      leftIcon && 'text-input--has-left-icon',
      rightIcon && 'text-input--has-right-icon',
      error && 'text-input--error',
      disabled && 'text-input--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="text-input-wrapper">
        {label && (
          <label htmlFor={inputId} className="text-input-label">
            {label}
            {required && <span className="text-input-required">*</span>}
          </label>
        )}

        <div className="text-input-container">
          {leftIcon && (
            <span className="text-input-icon text-input-icon--left">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              [errorId, helperId].filter(Boolean).join(' ') || undefined
            }
            {...props}
          />

          {rightIcon && (
            <span className="text-input-icon text-input-icon--right">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Always render message slot to prevent layout shift */}
        <div className="text-input-message-slot">
          {error && (
            <p id={errorId} className="text-input-error" role="alert">
              {error}
            </p>
          )}

          {helperText && !error && (
            <p id={helperId} className="text-input-helper">
              {helperText}
            </p>
          )}

          {!error && !helperText && (
            <p className="text-input-message-placeholder" aria-hidden="true">
              {/* Placeholder to maintain layout */}
            </p>
          )}
        </div>
      </div>
    );
  },
);

TextInput.displayName = 'TextInput';

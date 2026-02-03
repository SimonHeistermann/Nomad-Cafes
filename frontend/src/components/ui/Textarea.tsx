import React from 'react';
import '@/styles/components/forms/textarea.css';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxHeight?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      maxHeight = 300,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || `textarea-${generatedId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const textareaClasses = [
      'textarea',
      error && 'textarea--error',
      disabled && 'textarea--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="textarea-wrapper">
        {label && (
          <label htmlFor={inputId} className="textarea-label">
            {label}
            {required && <span className="textarea-required">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          className={textareaClasses}
          disabled={disabled}
          required={required}
          style={{ maxHeight: `${maxHeight}px` }}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            [errorId, helperId].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />

        {/* Always render message slot to prevent layout shift */}
        <div className="textarea-message-slot">
          {error && (
            <p id={errorId} className="textarea-error" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="textarea-helper">
              {helperText}
            </p>
          )}
          {!error && !helperText && (
            <p className="textarea-message-placeholder" aria-hidden="true">
              {/* Placeholder to maintain layout */}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

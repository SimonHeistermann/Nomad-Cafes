import React from 'react';

export interface HoneypotProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Honeypot field for bot protection.
 * This field is hidden from users but visible to bots.
 * If the field is filled, the submission is likely from a bot.
 *
 * Usage:
 * ```tsx
 * const [honeypot, setHoneypot] = useState('');
 *
 * // In form submission:
 * if (honeypot) {
 *   // Likely a bot, reject silently
 *   return;
 * }
 *
 * // In form JSX:
 * <Honeypot value={honeypot} onChange={setHoneypot} />
 * ```
 */
export const Honeypot: React.FC<HoneypotProps> = ({ value, onChange }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <label htmlFor="website-field">
        Website (leave blank)
        <input
          type="text"
          id="website-field"
          name="website"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
};

import React, { useState, useRef, useCallback } from 'react';
import { FiInfo } from 'react-icons/fi';
import '@/styles/components/ui/info-icon.css';

export interface InfoIconProps {
  /** Tooltip content to display on hover */
  content: React.ReactNode;
  /** Optional size in pixels */
  size?: number;
  /** Optional position of tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoIcon: React.FC<InfoIconProps> = ({
  content,
  size = 20,
  position = 'bottom',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearHideTimeout();
    setIsVisible(true);
  }, [clearHideTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearHideTimeout();
    // Delay hiding by 150ms to bridge hover gaps
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 150);
  }, [clearHideTimeout]);

  return (
    <div
      className="info-icon-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="info-icon"
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Information"
      >
        <FiInfo size={size} />
      </button>

      {isVisible && (
        <div
          className={`info-icon-tooltip info-icon-tooltip--${position}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </div>
      )}
    </div>
  );
};

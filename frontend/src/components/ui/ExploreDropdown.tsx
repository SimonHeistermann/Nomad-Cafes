import React, {
    useState,
    useRef,
    useEffect,
    useId,
    useCallback,
  } from 'react';
  import type {
    KeyboardEvent as ReactKeyboardEvent,
    MouseEvent as ReactMouseEvent,
  } from 'react';
  import '@/styles/pages/explore.css';
  import type { DropdownOption } from '@/lib/constants/exploreFilters';
  
  type ExploreDropdownProps = {
    label?: string;
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    align?: 'left' | 'right';
  };
  
  const ExploreDropdown: React.FC<ExploreDropdownProps> = ({
    label,
    value,
    options,
    onChange,
    align = 'left',
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const dropdownId = useId();
  
    const current = options.find((opt) => opt.value === value) ?? options[0];
  
    const panelId = `${dropdownId}-listbox`;
    const labelId = label ? `${dropdownId}-label` : undefined;
  
    const open = useCallback(() => {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex);
      setIsOpen(true);
    }, [options, value]);
  
    const close = useCallback(() => {
      setIsOpen(false);
    }, []);
  
    const handleSelect = useCallback(
      (val: string) => {
        onChange(val);
        close();
      },
      [onChange, close],
    );
  
    // Click outside + Escape (DOM Events)
    useEffect(() => {
      if (!isOpen) return;
  
      const handleClickOutside = (event: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
          close();
        }
      };
  
      const handleKeyDownEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          close();
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDownEscape);
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDownEscape);
      };
    }, [isOpen, close]);
  
    const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      }
  
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        setHighlightedIndex((prev) =>
          prev - 1 < 0 ? options.length - 1 : prev - 1,
        );
      }
  
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!isOpen) {
          open();
          return;
        }
        const opt = options[highlightedIndex];
        if (opt) handleSelect(opt.value);
      }
    };
  
    return (
      <div className="explore-filter">
        {label && (
          <span className="explore-filter-label" id={labelId}>
            {label}
          </span>
        )}
  
        <div
          className={`explore-dropdown ${
            isOpen ? 'explore-dropdown--open' : ''
          } ${align === 'right' ? 'explore-dropdown--align-right' : ''}`}
          ref={rootRef}
        >
          <button
            type="button"
            className="explore-dropdown-button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={panelId}
            {...(labelId
              ? { 'aria-labelledby': labelId }
              : { 'aria-label': current?.label || 'Filter' })}
            onClick={(
              _event: ReactMouseEvent<
                HTMLButtonElement,
                globalThis.MouseEvent
              >,
            ) => {
              if (isOpen) {
                close();
              } else {
                open();
              }
            }}
            onKeyDown={handleKeyDown}
          >
            <span className="explore-dropdown-value">{current.label}</span>
            <span className="explore-dropdown-chevron">▾</span>
          </button>
  
          {isOpen && (
            <div className="explore-dropdown-panel" role="listbox" id={panelId}>
              {options.map((opt, index) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={`explore-dropdown-option ${
                    opt.value === value ? 'explore-dropdown-option--active' : ''
                  } ${
                    index === highlightedIndex
                      ? 'explore-dropdown-option--highlighted'
                      : ''
                  }`}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
};
  
export default ExploreDropdown;  
import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent as ReactKeyboardEvent,
  FormEvent,
} from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiChevronDown as FiArrowDown,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '@/styles/layout/hero.css';
import { useLocationOptions, useTopLocationNames } from '@/lib/hooks/useLocations';
import { sanitizeInput } from '@/lib/utils/sanitize';

const DROPDOWN_LABEL_ID = 'hero-where-label';
const DROPDOWN_LISTBOX_ID = 'hero-location-listbox';

export interface HeroSectionProps {
  searchValue?: string;
  locationValue?: string;
  onSearchChange?: (value: string) => void;
  onLocationChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  searchValue,
  locationValue,
  onSearchChange,
  onLocationChange,
  onSearchSubmit,
}) => {
  const { t } = useTranslation();

  // Fetch locations from API
  const { options: LOCATIONS } = useLocationOptions();
  const { names: topLocationNames } = useTopLocationNames(2);

  const [what, setWhat] = useState('');
  // Default to "All locations"
  const [location, setLocation] = useState<string>('any');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Use controlled values if provided
  const effectiveWhat = searchValue !== undefined ? searchValue : what;
  const effectiveLocation = locationValue !== undefined ? locationValue : location;

  // Fallback to translation keys if API hasn't loaded yet
  const topLocations = topLocationNames.length > 0
    ? topLocationNames
    : [t('locations.bali'), t('locations.lisbon')];

  const currentLocation =
    LOCATIONS.find((l) => l.value === effectiveLocation) ?? LOCATIONS[0];

  const openDropdown = () => {
    setIsLocationOpen(true);
    const currentIndex = LOCATIONS.findIndex((l) => l.value === effectiveLocation);
    setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex);
  };

  const closeDropdown = () => {
    setIsLocationOpen(false);
  };

  const handleSelectLocation = (value: string) => {
    setLocation(value);
    if (onLocationChange) {
      onLocationChange(value);
    }
    closeDropdown();
  };

  const handleWhatChange = (value: string) => {
    setWhat(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  useEffect(() => {
    if (!isLocationOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleKeyDownEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDownEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDownEscape);
    };
  }, [isLocationOpen]);

  const handleDropdownKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isLocationOpen) {
        openDropdown();
        return;
      }
      setHighlightedIndex((prev) => (prev + 1) % LOCATIONS.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isLocationOpen) {
        openDropdown();
        return;
      }
      setHighlightedIndex((prev) =>
        prev - 1 < 0 ? LOCATIONS.length - 1 : prev - 1,
      );
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isLocationOpen) {
        openDropdown();
        return;
      }
      const loc = LOCATIONS[highlightedIndex];
      if (loc) {
        handleSelectLocation(loc.value);
      }
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Use callback if provided, otherwise navigate directly
    if (onSearchSubmit) {
      onSearchSubmit();
      return;
    }

    // Sanitize search query to prevent XSS
    const sanitizedQuery = sanitizeInput(effectiveWhat.trim());

    const params = new URLSearchParams();
    if (sanitizedQuery) params.set('q', sanitizedQuery);
    if (effectiveLocation && effectiveLocation !== 'any') params.set('location', effectiveLocation);

    navigate(`/explore?${params.toString()}`);
    window.scrollTo(0, 0);
  };

  const handleScrollToPopular = () => {
    const el = document.getElementById('popular-cafes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const highlightedLocation = LOCATIONS[highlightedIndex];
  const highlightedOptionId =
    isLocationOpen && highlightedLocation
      ? `hero-location-option-${highlightedLocation.value}`
      : undefined;

  return (
    <section className="hero">
      <div className="hero-backdrop" />

      <div className="app-container hero-inner">
        <div className="hero-content">
          <p className="hero-eyebrow">
            {t('hero.eyebrow')}
          </p>

          <h1 className="hero-title">{t('hero.customTitle')}</h1>

          <p className="hero-subtitle">
            {t('hero.customSubtitle', { locations: topLocations.join(' & ') })}
          </p>

          <div className="hero-search-wrapper">
            <form
              className="hero-search"
              onSubmit={handleSearch}
              role="search"
              noValidate
            >
              <div className="hero-search-field">
                <label className="hero-field-label" htmlFor="hero-what">
                  {t('hero.whatLabel')}
                </label>
                <input
                  id="hero-what"
                  className="hero-field-input"
                  type="text"
                  placeholder={t('hero.whatInputPlaceholder')}
                  value={effectiveWhat}
                  onChange={(e) => handleWhatChange(e.target.value)}
                />
              </div>

              <div className="hero-search-divider" />

              <div
                className={`hero-search-field hero-field-dropdown ${
                  isLocationOpen ? 'hero-field-dropdown--open' : ''
                }`}
                ref={dropdownRef}
                tabIndex={0}
                onKeyDown={handleDropdownKeyDown}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isLocationOpen}
                aria-controls={DROPDOWN_LISTBOX_ID}
                aria-labelledby={DROPDOWN_LABEL_ID}
                aria-activedescendant={highlightedOptionId}
              >
                <button
                  type="button"
                  className="hero-field-dropdown-button"
                  onClick={() =>
                    setIsLocationOpen((prev) => {
                      if (!prev) openDropdown();
                      else closeDropdown();
                      return !prev;
                    })
                  }
                >
                  <span className="hero-field-label" id={DROPDOWN_LABEL_ID}>
                    {t('hero.whereLabel')}
                  </span>
                  <span className="hero-field-value">
                    {currentLocation.label}
                  </span>
                  <FiChevronDown className="hero-field-chevron" />
                </button>

                {isLocationOpen && (
                  <div
                    className="hero-dropdown-panel"
                    role="listbox"
                    id={DROPDOWN_LISTBOX_ID}
                    aria-labelledby={DROPDOWN_LABEL_ID}
                  >
                    {LOCATIONS.map((loc, index) => (
                      <button
                        key={loc.value}
                        type="button"
                        id={`hero-location-option-${loc.value}`}
                        className={`hero-dropdown-option ${
                          loc.value === effectiveLocation
                            ? 'hero-dropdown-option--active'
                            : ''
                        } ${
                          index === highlightedIndex
                            ? 'hero-dropdown-option--highlighted'
                            : ''
                        }`}
                        onClick={() => handleSelectLocation(loc.value)}
                        role="option"
                        aria-selected={loc.value === effectiveLocation}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="hero-search-button"
                type="submit"
                aria-label={t('hero.searchButton')}
              >
                <FiSearch className="hero-search-icon" />
              </button>
            </form>
          </div>

          <button
            type="button"
            className="hero-note"
            onClick={handleScrollToPopular}
          >
            <FiArrowDown className="hero-note-icon" />
            <span>
              {t('hero.scrollDown', { locations: topLocations.join(' & ') })}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
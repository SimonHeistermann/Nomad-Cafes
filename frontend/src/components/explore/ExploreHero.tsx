import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, FormEvent } from 'react';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import '@/styles/layout/hero.css';
import { useLocationOptions, useTopLocationNames } from '@/lib/hooks/useLocations';
import { sanitizeInput } from '@/lib/utils/sanitize';

const EXPLORE_DROPDOWN_LABEL_ID = 'explore-where-label';
const EXPLORE_DROPDOWN_LISTBOX_ID = 'explore-location-listbox';

type ExploreHeroProps = {
  what: string;
  location: string;
  onChangeWhat: (value: string) => void;
  onChangeLocation: (value: string) => void;
  onSubmitSearch: () => void;
};

const ExploreHero: React.FC<ExploreHeroProps> = ({
  what,
  location,
  onChangeWhat,
  onChangeLocation,
  onSubmitSearch,
}) => {
  const { t } = useTranslation();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch locations from API
  const { options: LOCATIONS } = useLocationOptions();
  const { names: topLocationNames } = useTopLocationNames(2);

  // Fallback to translation keys if API hasn't loaded yet
  const topLocations = topLocationNames.length > 0
    ? topLocationNames
    : [t('locations.bali'), t('locations.lisbon')];

  const currentLocation =
    LOCATIONS.find((l) => l.value === location) ?? LOCATIONS[0];

  const openDropdown = () => {
    setIsLocationOpen(true);
    const currentIndex = LOCATIONS.findIndex((l) => l.value === location);
    setHighlightedIndex(currentIndex === -1 ? 0 : currentIndex);
  };

  const closeDropdown = () => {
    setIsLocationOpen(false);
  };

  const handleSelectLocation = (value: string) => {
    onChangeLocation(value);
    closeDropdown();
  };

  // Click outside + Escape (DOM Events)
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
    onSubmitSearch();
  };

  const highlightedLocation = LOCATIONS[highlightedIndex];
  const highlightedOptionId =
    isLocationOpen && highlightedLocation
      ? `explore-location-option-${highlightedLocation.value}`
      : undefined;

  return (
    <section className="hero hero--compact">
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
              {/* WHAT */}
              <div className="hero-search-field">
                <label className="hero-field-label" htmlFor="explore-what">
                  {t('hero.whatLabel')}
                </label>
                <input
                  id="explore-what"
                  className="hero-field-input"
                  type="text"
                  placeholder={t('hero.whatInputPlaceholder')}
                  value={what}
                  onChange={(e) => onChangeWhat(sanitizeInput(e.target.value))}
                />
              </div>

              {/* Divider */}
              <div className="hero-search-divider" />

              {/* WHERE – Custom Dropdown */}
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
                aria-controls={EXPLORE_DROPDOWN_LISTBOX_ID}
                aria-labelledby={EXPLORE_DROPDOWN_LABEL_ID}
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
                  <span
                    className="hero-field-label"
                    id={EXPLORE_DROPDOWN_LABEL_ID}
                  >
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
                    id={EXPLORE_DROPDOWN_LISTBOX_ID}
                    aria-labelledby={EXPLORE_DROPDOWN_LABEL_ID}
                  >
                    {LOCATIONS.map((loc, index) => (
                      <button
                        key={loc.value}
                        type="button"
                        id={`explore-location-option-${loc.value}`}
                        className={`hero-dropdown-option ${
                          loc.value === location
                            ? 'hero-dropdown-option--active'
                            : ''
                        } ${
                          index === highlightedIndex
                            ? 'hero-dropdown-option--highlighted'
                            : ''
                        }`}
                        onClick={() => handleSelectLocation(loc.value)}
                        role="option"
                        aria-selected={loc.value === location}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SEARCH BUTTON */}
              <button
                className="hero-search-button"
                type="submit"
                aria-label={t('hero.searchButton')}
              >
                <FiSearch className="hero-search-icon" />
              </button>
            </form>
          </div>

          {/* kein Scroll-Hinweis auf Explore */}
        </div>
      </div>
    </section>
  );
};

export default ExploreHero;

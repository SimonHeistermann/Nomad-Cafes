import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/styles/components/navigation/language-switcher.css';

type Language = {
  code: string;
  label: string;
};

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-switcher-button"
        onClick={handleToggle}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="language-switcher-code">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="language-switcher-dropdown">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              className={`language-switcher-option ${
                language.code === currentLanguage.code ? 'language-switcher-option--active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="language-switcher-option-label">{language.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import CardListing from '@/components/ui/CardListing';
import type { Cafe } from '@/types/cafe';
import '@/styles/components/search/search-results.css';

export interface SearchResultsProps {
  results: Cafe[];
  isSearching: boolean;
  hasSearched: boolean;
  viewMode?: 'grid' | 'list';
  showMeta?: boolean;
  limit?: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isSearching,
  hasSearched,
  viewMode = 'grid',
  showMeta = true,
  limit,
}) => {
  const { t } = useTranslation();

  const displayResults = limit ? results.slice(0, limit) : results;
  const totalResults = results.length;

  if (isSearching) {
    return (
      <div className="search-results-status">
        <p>{t('explore.searching')}</p>
      </div>
    );
  }

  if (!hasSearched) {
    return null;
  }

  if (totalResults === 0) {
    return (
      <div className="search-results-status">
        <p>{t('explore.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      {showMeta && (
        <p className="search-results-meta">
          {t('explore.showingResults', {
            count: displayResults.length,
            total: totalResults,
          })}
        </p>
      )}

      <section
        className={`search-results-grid ${
          viewMode === 'list' ? 'search-results-grid--list' : ''
        }`}
      >
        <AnimatePresence mode="wait">
          {displayResults.map((cafe, index) => (
            <motion.div
              key={cafe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: 'easeOut',
              }}
            >
              <CardListing cafe={cafe} />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </div>
  );
};

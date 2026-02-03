import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ExploreHero from '@/components/explore/ExploreHero';
import CardListing from '@/components/ui/CardListing';
import Pagination from '@/components/ui/Pagination';
import ExploreDropdown from '@/components/ui/ExploreDropdown';
import { TagLegend } from '@/components/ui/TagLegend';
import { useCafes } from '@/lib/hooks/useCafes';
import {
  getCategoryOptions,
  getPriceRangeOptions,
  getTagOptions,
  getSortOptions,
} from '@/lib/utils/filterTranslations';
import '@/styles/pages/explore.css';

const ITEMS_PER_PAGE = 12;

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstFilterEffect = useRef(true);

  // Memoize translated filter options
  const categoryOptions = useMemo(() => getCategoryOptions(t), [t]);
  const priceRangeOptions = useMemo(() => getPriceRangeOptions(t), [t]);
  const tagOptions = useMemo(() => getTagOptions(t), [t]);
  const sortOptions = useMemo(() => getSortOptions(t), [t]);

  // --- View-Modus aus URL ---

  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const fromUrl = searchParams.get('view');
    return fromUrl === 'list' ? 'list' : 'grid';
  });

  // --- Filter-State aus URL ---

  const [category, setCategory] = useState<string>(() => {
    return searchParams.get('category') || 'all';
  });

  const [priceRange, setPriceRange] = useState<string>(() => {
    return searchParams.get('price') || 'any';
  });

  const [tag, setTag] = useState<string>(() => {
    return searchParams.get('tag') || 'any';
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    return searchParams.get('sort') || 'default';
  });

  // --- Such-State aus URL (q + location) ---

  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('q') || '';
  });

  const [searchLocation, setSearchLocation] = useState<string>(() => {
    const fromUrl = searchParams.get('location');
    return fromUrl || 'any';
  });

  const [page, setPage] = useState<number>(() => {
    const raw = searchParams.get('page');
    const parsed = raw ? parseInt(raw, 10) : 1;
    if (Number.isNaN(parsed) || parsed < 1) return 1;
    return parsed;
  });

  // Update state when URL parameters change
  useEffect(() => {
    const locationParam = searchParams.get('location');
    const newLocation = locationParam || 'any';
    setSearchLocation(newLocation);

    const queryParam = searchParams.get('q');
    const newQuery = queryParam || '';
    setSearchQuery(newQuery);
  }, [searchParams.get('location'), searchParams.get('q')]);

  // --- Fetch cafes from API ---
  const {
    cafes,
    totalCount,
    totalPages,
    isLoading,
    error,
  } = useCafes({
    category,
    priceRange,
    tag,
    sortBy,
    query: searchQuery,
    location: searchLocation,
    page,
    pageSize: ITEMS_PER_PAGE,
  });

  // --- Pagination: Callback + Scroll ---

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Suche aus Hero-Formular (oben) ---

  const handleHeroSearch = () => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    setPage(1);
  }, [category, priceRange, tag, sortBy, searchQuery, searchLocation]);

  // --- URL-State synchronisieren (Query-Params updaten) ---

  useEffect(() => {
    const params = new URLSearchParams();

    if (viewMode !== 'grid') params.set('view', viewMode);
    if (category !== 'all') params.set('category', category);
    if (priceRange !== 'any') params.set('price', priceRange);
    if (tag !== 'any') params.set('tag', tag);
    if (sortBy !== 'default') params.set('sort', sortBy);

    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchLocation && searchLocation !== 'any') {
      params.set('location', searchLocation);
    }

    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [
    viewMode,
    category,
    priceRange,
    tag,
    sortBy,
    searchQuery,
    searchLocation,
    page,
    setSearchParams,
  ]);

  return (
    <>
      <ExploreHero
        what={searchQuery}
        location={searchLocation}
        onChangeWhat={setSearchQuery}
        onChangeLocation={setSearchLocation}
        onSubmitSearch={handleHeroSearch}
      />

      <main className="explore-main">
        <div className="app-container">
          {/* Toolbar */}
          <div className="explore-toolbar">
            <div className="explore-toolbar-left">
              <ExploreDropdown
                label={t('explore.filters.categories')}
                value={category}
                options={categoryOptions}
                onChange={setCategory}
              />
              <ExploreDropdown
                label={t('explore.filters.priceRange')}
                value={priceRange}
                options={priceRangeOptions}
                onChange={setPriceRange}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExploreDropdown
                  label={t('explore.filters.features')}
                  value={tag}
                  options={tagOptions}
                  onChange={setTag}
                />
                <TagLegend />
              </div>
            </div>

            <div className="explore-toolbar-right">
              <div className="explore-sort">
                <span className="explore-sort-label">{t('explore.filters.sortBy')}</span>
                <ExploreDropdown
                  label=""
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                  align="right"
                />
              </div>

              <div className="explore-view-toggle" aria-label="View mode">
                <button
                  type="button"
                  className={`explore-view-button ${
                    viewMode === 'grid'
                      ? 'explore-view-button--active'
                      : ''
                  }`}
                  onClick={() => setViewMode('grid')}
                >
                  <span className="explore-view-icon explore-view-icon--grid" />
                </button>
                <button
                  type="button"
                  className={`explore-view-button ${
                    viewMode === 'list'
                      ? 'explore-view-button--active'
                      : ''
                  }`}
                  onClick={() => setViewMode('list')}
                >
                  <span className="explore-view-icon explore-view-icon--list" />
                </button>
              </div>
            </div>
          </div>

          {/* Meta */}
          <p className="explore-results-meta">
            {isLoading
              ? t('common.loading')
              : t('explore.showingResults', { count: cafes.length, total: totalCount })}
          </p>

          {/* Error */}
          {error && (
            <div className="explore-error">
              <p>{t('common.errorLoading')}: {error}</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="explore-loading">
              <div className="explore-loading-spinner" />
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && (
            <section
              className={`explore-results-grid ${
                viewMode === 'list' ? 'explore-results-grid--list' : ''
              }`}
            >
              <AnimatePresence mode="wait">
                {cafes.map((cafe, index) => (
                  <motion.div
                    key={cafe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: 'easeOut'
                    }}
                  >
                    <CardListing cafe={cafe} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>
          )}

          {/* No results */}
          {!isLoading && !error && cafes.length === 0 && (
            <div className="explore-no-results">
              <p>{t('explore.noResults')}</p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </main>
    </>
  );
};

export default Explore;

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroSection from '@/components/home/HeroSection';
import StatsSection from '@/components/home/StatsSection';
import PopularCafesSection from '@/components/home/PopularCafesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TrendingLocationsSection from '@/components/home/TrendingLocationsSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import SubmitVenueSection from '@/components/home/SubmitVenueSection';
import HomeFooter from '@/components/home/HomeFooter';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/lib/hooks/useSearch';
import type { TrendingLocation } from '@/types/location';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('any');

  // Live search results
  const { results, isSearching, hasSearched } = useSearch({
    query: what,
    location: where,
    debounceMs: 300,
  });

  // Handle hash scrolling on mount and when hash changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  const handleLocationClick = (location: TrendingLocation) => {
    // Use location.id which is already the correct slug (e.g., "chiang-mai")
    navigate(`/explore?location=${encodeURIComponent(location.id)}`);
  };

  const handleSearchSubmit = () => {
    // Navigate to explore on Enter without transition animation
    const params = new URLSearchParams();
    if (what.trim()) params.set('q', what.trim());
    if (where && where !== 'any') params.set('location', where);

    navigate(`/explore?${params.toString()}`, {
      state: { disableTransition: true },
    });
  };

  return (
    <>
      <HeroSection
        onSearchChange={setWhat}
        onLocationChange={setWhere}
        onSearchSubmit={handleSearchSubmit}
        searchValue={what}
        locationValue={where}
      />

      {/* Show search results inline when searching */}
      {hasSearched && (
        <div className="app-container" style={{ paddingTop: '2rem' }}>
          <SearchResults
            results={results}
            isSearching={isSearching}
            hasSearched={hasSearched}
            limit={6}
          />
        </div>
      )}

      {/* Show normal home content when not searching */}
      {!hasSearched && (
        <>
          <StatsSection />
          <PopularCafesSection />
          <HowItWorksSection />
          <TrendingLocationsSection onLocationClick={handleLocationClick} />
          <FeaturesSection />
          <TestimonialsSection />
          <SubmitVenueSection />
          <HomeFooter />
        </>
      )}
    </>
  );
};

export default Home;
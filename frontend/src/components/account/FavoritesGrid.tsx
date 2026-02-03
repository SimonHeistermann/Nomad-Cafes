import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cafe } from '@/types/cafe';
import CardListing from '@/components/ui/CardListing';
import { FiHeart } from 'react-icons/fi';
import '@/styles/pages/favorites.css';

export interface FavoritesGridProps {
  cafes: Cafe[];
  onRemoveFavorite?: (cafeId: string) => void;
  isLoading?: boolean;
}

export const FavoritesGrid: React.FC<FavoritesGridProps> = ({
  cafes,
  onRemoveFavorite: _onRemoveFavorite,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="favorites-grid">
        <div className="favorites-loading">
          <div className="spinner" />
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (cafes.length === 0) {
    return (
      <div className="favorites-grid">
        <div className="favorites-empty">
          <FiHeart size={64} />
          <h2>No favorites yet</h2>
          <p>Save cafes you want to visit later</p>
          <button
            type="button"
            className="favorites-empty-button"
            onClick={() => navigate('/explore')}
          >
            Explore cafes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-grid">
      <div className="favorites-header">
        <h2 className="favorites-title">Your Favorites</h2>
        <p className="favorites-count">
          {cafes.length} {cafes.length === 1 ? 'cafe' : 'cafes'} saved
        </p>
      </div>

      <div className="favorites-list">
        {cafes.map((cafe) => (
          <CardListing
            key={cafe.id}
            cafe={cafe}
          />
        ))}
      </div>
    </div>
  );
};

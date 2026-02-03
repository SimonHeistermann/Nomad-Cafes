import React from 'react';
import { useFavorites } from '@/contexts';
import { FavoritesGrid } from '@/components/account/FavoritesGrid';

/**
 * Favorites page - displays user's saved cafes.
 * ProtectedRoute ensures authentication before rendering.
 */
const Favorites: React.FC = () => {
  const { favorites, isLoading, removeFavorite } = useFavorites();

  const handleRemoveFavorite = async (cafeId: string) => {
    try {
      await removeFavorite(cafeId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  return (
    <main style={{ padding: '120px 0 80px', minHeight: '100vh' }}>
      <FavoritesGrid
        cafes={favorites}
        onRemoveFavorite={handleRemoveFavorite}
        isLoading={isLoading}
      />
    </main>
  );
};

export default Favorites;

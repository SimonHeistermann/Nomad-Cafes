import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from '../FavoritesContext';
import { AuthProvider } from '../AuthContext';
import { ToastProvider } from '../ToastContext';
import { apiClient } from '@/api/client';
import { BrowserRouter } from 'react-router-dom';

// Mock the API client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('../AuthContext', async () => {
  const actual = await vi.importActual('../AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(() => ({ isAuthenticated: true })),
  };
});

// Mock errorHandler
vi.mock('@/lib/utils/errorHandler', () => ({
  getErrorMessage: vi.fn((err) => err?.message || 'Unknown error'),
  isServerError: vi.fn((err) => err?.status >= 500),
  getServerErrorMessage: vi.fn(() => 'Server error'),
}));

// Test component that uses favorites
function TestComponent({ onReady }: { onReady?: (fav: ReturnType<typeof useFavorites>) => void }) {
  const favorites = useFavorites();

  if (onReady) {
    onReady(favorites);
  }

  return (
    <div>
      <span data-testid="loading">{favorites.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="error">{favorites.error || 'none'}</span>
      <span data-testid="count">{favorites.favorites.length}</span>
    </div>
  );
}

// Wrapper with providers
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ToastProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

describe('FavoritesContext', () => {
  const mockCafe = {
    id: 'cafe-1',
    name: 'Test Cafe',
    slug: 'test-cafe',
    description: 'A test cafe',
    image_url: 'https://example.com/image.jpg',
    price_level: 2,
    rating_avg: 4.5,
    rating_count: 10,
    is_featured: false,
    is_favorited: true,
    city: 'Berlin',
    category: 'cafe',
    category_color: '#000',
    features: [],
  };

  const mockFavorite = {
    id: 'fav-1',
    cafe: mockCafe,
    created_at: '2024-01-01T00:00:00Z',
  };

  const originalError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('useFavorites outside provider', () => {
    it('throws error when used outside FavoritesProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useFavorites must be used within FavoritesProvider');

      spy.mockRestore();
    });
  });

  describe('fetchFavorites', () => {
    it('handles successful fetch', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { results: [mockFavorite] },
      });

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('handles fetch failure with user error (4xx)', async () => {
      const { isServerError } = await import('@/lib/utils/errorHandler');
      (isServerError as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const error = { message: 'Unauthorized', status: 401 };
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Should set error state for user errors
      expect(screen.getByTestId('error')).toHaveTextContent('Unauthorized');
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('handles fetch failure with server error (5xx)', async () => {
      const { isServerError, getServerErrorMessage } = await import('@/lib/utils/errorHandler');
      (isServerError as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (getServerErrorMessage as ReturnType<typeof vi.fn>).mockReturnValue('Server unavailable');

      const error = { message: 'Internal Server Error', status: 500 };
      (apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      render(
        <Wrapper>
          <TestComponent />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Server errors should clear favorites but not set inline error
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });

  describe('addFavorite', () => {
    it('handles add failure gracefully', async () => {
      // Initial successful fetch
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { results: [] },
      });

      const error = { message: 'Failed to add', status: 400 };
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      // Try to add favorite - should throw
      await expect(
        act(async () => {
          await favContext!.addFavorite('cafe-123');
        })
      ).rejects.toEqual(error);
    });

    it('handles server error on add', async () => {
      const { isServerError, getServerErrorMessage } = await import('@/lib/utils/errorHandler');
      (isServerError as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (getServerErrorMessage as ReturnType<typeof vi.fn>).mockReturnValue('Server error');

      // Initial fetch
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { results: [] },
      });

      const error = { message: 'Internal error', status: 500 };
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await expect(
        act(async () => {
          await favContext!.addFavorite('cafe-123');
        })
      ).rejects.toEqual(error);
    });
  });

  describe('removeFavorite', () => {
    it('performs optimistic update and reverts on failure', async () => {
      // Initial fetch with one favorite
      (apiClient.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { results: [mockFavorite] } })
        // Refetch after error
        .mockResolvedValueOnce({ data: { results: [mockFavorite] } });

      const error = { message: 'Delete failed', status: 500 };
      (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
      });

      // Try to remove - should fail and revert
      await expect(
        act(async () => {
          await favContext!.removeFavorite('cafe-1');
        })
      ).rejects.toEqual(error);

      // Should have refetched to revert
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('toggleFavorite', () => {
    it('performs optimistic update for toggle', async () => {
      // Initial fetch
      (apiClient.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { results: [mockFavorite] } })
        // Refetch after error
        .mockResolvedValueOnce({ data: { results: [mockFavorite] } });

      const error = { message: 'Toggle failed', status: 400 };
      (apiClient.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('1');
      });

      // Toggle off (delete) - should fail
      await act(async () => {
        await favContext!.toggleFavorite('cafe-1');
      });

      // Should have refetched
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    it('handles toggle add with refetch', async () => {
      // Initial empty
      (apiClient.get as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ data: { results: [] } })
        // After add
        .mockResolvedValueOnce({ data: { results: [mockFavorite] } });

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('0');
      });

      // Toggle on (add)
      await act(async () => {
        await favContext!.toggleFavorite('cafe-1');
      });

      // Should refetch to get full cafe data
      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('isFavorite', () => {
    it('correctly checks if cafe is favorited', async () => {
      (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { results: [mockFavorite] },
      });

      let favContext: ReturnType<typeof useFavorites>;
      render(
        <Wrapper>
          <TestComponent onReady={(fav) => { favContext = fav; }} />
        </Wrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(favContext!.isFavorite('cafe-1')).toBe(true);
      expect(favContext!.isFavorite('cafe-unknown')).toBe(false);
    });
  });
});

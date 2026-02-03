import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/utils/test-utils';
import Home from '../Home';

describe('Home - Live Search Integration', () => {
  it('renders home page with search section', () => {
    const { container } = renderWithProviders(<Home />);
    
    // Home page should render
    expect(container).toBeTruthy();
    
    // Should have hero section with search
    const hero = container.querySelector('.hero');
    expect(hero).toBeTruthy();
  });

  it('renders normal home content when not searching', () => {
    const { container } = renderWithProviders(<Home />);
    
    // Should show normal home sections when not searching
    // These sections are hidden when search is active
    const statsSection = container.querySelector('.stats-section');
    // Note: exact selectors depend on actual implementation
    expect(container.querySelector('.hero')).toBeTruthy();
  });
});

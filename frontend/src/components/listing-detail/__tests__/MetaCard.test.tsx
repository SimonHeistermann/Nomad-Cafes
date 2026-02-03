import { describe, it, expect } from 'vitest';
import { screen, render } from '@testing-library/react';
import { MetaCard } from '../MetaCard';
import '@/lib/i18n/config';

describe('MetaCard - Connect Section Conditional Rendering', () => {
  it('does not render Connect section when no social links are provided', () => {
    render(
      <MetaCard
        priceRangeLabel="$ 5–10 / drink"
        ownerName="Test Owner"
      />
    );

    // Connect section should not exist
    expect(screen.queryByText(/connect/i)).not.toBeInTheDocument();
  });

  it('renders Connect section with only website when only website is provided', () => {
    render(
      <MetaCard
        websiteUrl="https://example.com"
        priceRangeLabel="$ 5–10 / drink"
      />
    );

    // Connect section should exist
    expect(screen.getByText(/connect/i)).toBeInTheDocument();

    // Should have exactly 1 social link (website)
    const socialLinks = document.querySelectorAll('.listing-meta-social a');
    expect(socialLinks).toHaveLength(1);

    // Website link should be present
    const websiteLink = screen.getByLabelText('Website');
    expect(websiteLink).toHaveAttribute('href', 'https://example.com');
  });

  it('renders Connect section with only Instagram when only Instagram is provided', () => {
    render(
      <MetaCard
        instagramUrl="https://instagram.com/test"
        priceRangeLabel="$ 5–10 / drink"
      />
    );

    // Connect section should exist
    expect(screen.getByText(/connect/i)).toBeInTheDocument();

    // Should have exactly 1 social link
    const socialLinks = document.querySelectorAll('.listing-meta-social a');
    expect(socialLinks).toHaveLength(1);

    // Instagram link should be present
    const instagramLink = screen.getByLabelText('Instagram');
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com/test');
  });

  it('renders Connect section with multiple social links when multiple are provided', () => {
    render(
      <MetaCard
        websiteUrl="https://example.com"
        instagramUrl="https://instagram.com/test"
        facebookUrl="https://facebook.com/test"
        tiktokUrl="https://tiktok.com/@test"
      />
    );

    // Connect section should exist
    expect(screen.getByText(/connect/i)).toBeInTheDocument();

    // Should have all 4 social links
    const socialLinks = document.querySelectorAll('.listing-meta-social a');
    expect(socialLinks).toHaveLength(4);

    // All links should be present
    expect(screen.getByLabelText('Website')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
  });

  it('renders only provided social links and skips missing ones', () => {
    render(
      <MetaCard
        websiteUrl="https://example.com"
        facebookUrl="https://facebook.com/test"
        // instagramUrl and tiktokUrl are missing
      />
    );

    expect(screen.getByText(/connect/i)).toBeInTheDocument();

    // Should have 2 links
    const socialLinks = document.querySelectorAll('.listing-meta-social a');
    expect(socialLinks).toHaveLength(2);

    expect(screen.getByLabelText('Website')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
    expect(screen.queryByLabelText('Instagram')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('TikTok')).not.toBeInTheDocument();
  });

  it('does not render entire MetaCard when no content is provided', () => {
    const { container } = render(<MetaCard />);

    // Component should return null
    expect(container.firstChild).toBeNull();
  });

  it('renders price and owner but not Connect when no social links', () => {
    render(
      <MetaCard
        priceRangeLabel="$ 5–10 / drink"
        ownerName="Test Owner"
        ownerRole="Manager"
      />
    );

    // Should render price and owner
    expect(screen.getByText('Test Owner')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();

    // But not Connect section
    expect(screen.queryByText(/connect/i)).not.toBeInTheDocument();
  });
});

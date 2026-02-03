import React from 'react';
import { motion as MOTION } from 'framer-motion';
import '@/styles/components/ui/trending-locations.css';
import type { TrendingLocation } from '@/types/location';

type LocationTileProps = {
  location: TrendingLocation;
  onClick?: (location: TrendingLocation) => void;
};

const LocationTile: React.FC<LocationTileProps> = ({ location, onClick }) => {
  const { name, subtitle, imageUrl } = location;

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick(location);
    } else {
      // TODO: Navigate to location detail page
      // navigate(`/location/${id}`);
    }
  };

  return (
    <MOTION.button
      type="button"
      className="trending-card"
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ scale: 1.015 }}
    >
      <div
        className="trending-card-media"
        style={
          imageUrl
            ? { backgroundImage: `url(${imageUrl})` }
            : undefined
        }
      >
        <div className="trending-card-gradient" />

        <div className="trending-card-content">
          <h3 className="trending-card-title">{name}</h3>
          {subtitle && (
            <p className="trending-card-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
    </MOTION.button>
  );
};

export default LocationTile;
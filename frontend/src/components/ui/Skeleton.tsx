import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  /** Width of the skeleton - can be a number (px) or string (e.g., '100%') */
  width?: number | string;
  /** Height of the skeleton - can be a number (px) or string (e.g., '1.5rem') */
  height?: number | string;
  /** Border radius - 'none' | 'sm' | 'md' | 'lg' | 'full' | number */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full' | number;
  /** Whether to show the shimmer animation */
  animate?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Skeleton loading placeholder component.
 * Use this to show a placeholder while content is loading.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton width={200} height={20} />
 *
 * // Full width text line
 * <Skeleton width="100%" height="1rem" />
 *
 * // Avatar placeholder
 * <Skeleton width={48} height={48} borderRadius="full" />
 *
 * // Card placeholder
 * <Skeleton width="100%" height={200} borderRadius="lg" />
 * ```
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = 'sm',
  animate = true,
  className = '',
  style,
}: SkeletonProps) {
  const getBorderRadius = () => {
    if (typeof borderRadius === 'number') return `${borderRadius}px`;
    switch (borderRadius) {
      case 'none':
        return '0';
      case 'sm':
        return '0.25rem';
      case 'md':
        return '0.5rem';
      case 'lg':
        return '0.75rem';
      case 'full':
        return '9999px';
      default:
        return '0.25rem';
    }
  };

  const computedStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: getBorderRadius(),
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${animate ? styles.animate : ''} ${className}`}
      style={computedStyle}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  /** Number of lines to show */
  lines?: number;
  /** Width of the last line (to make it look more natural) */
  lastLineWidth?: string;
  /** Line height */
  lineHeight?: number | string;
  /** Gap between lines */
  gap?: number | string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skeleton text placeholder - shows multiple lines like a paragraph.
 *
 * @example
 * ```tsx
 * <SkeletonText lines={3} />
 * <SkeletonText lines={2} lastLineWidth="60%" />
 * ```
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '70%',
  lineHeight = '1rem',
  gap = '0.5rem',
  className = '',
}: SkeletonTextProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  /** Whether to show an image placeholder */
  showImage?: boolean;
  /** Image height */
  imageHeight?: number | string;
  /** Number of text lines */
  textLines?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skeleton card placeholder - shows a card-like loading state.
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * <SkeletonCard showImage imageHeight={200} textLines={2} />
 * ```
 */
export function SkeletonCard({
  showImage = true,
  imageHeight = 180,
  textLines = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <div className={`${styles.card} ${className}`}>
      {showImage && (
        <Skeleton width="100%" height={imageHeight} borderRadius="md" />
      )}
      <div className={styles.cardContent}>
        <Skeleton width="70%" height="1.25rem" borderRadius="sm" />
        <Skeleton width="50%" height="0.875rem" borderRadius="sm" />
        <SkeletonText lines={textLines} lineHeight="0.75rem" />
      </div>
    </div>
  );
}

interface SkeletonCafeCardProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Skeleton specifically designed for CafeCard loading state.
 *
 * @example
 * ```tsx
 * {isLoading ? <SkeletonCafeCard /> : <CafeCard cafe={cafe} />}
 * ```
 */
export function SkeletonCafeCard({ className = '' }: SkeletonCafeCardProps) {
  return (
    <div className={`${styles.cafeCard} ${className}`}>
      {/* Image */}
      <Skeleton width="100%" height={200} borderRadius="lg" />

      {/* Content */}
      <div className={styles.cafeCardContent}>
        {/* Category badge */}
        <Skeleton width={80} height={24} borderRadius="full" />

        {/* Title */}
        <Skeleton width="85%" height="1.25rem" borderRadius="sm" />

        {/* Location */}
        <Skeleton width="60%" height="0.875rem" borderRadius="sm" />

        {/* Rating and price */}
        <div className={styles.cafeCardMeta}>
          <Skeleton width={100} height="1rem" borderRadius="sm" />
          <Skeleton width={60} height="1rem" borderRadius="sm" />
        </div>

        {/* Features */}
        <div className={styles.cafeCardFeatures}>
          <Skeleton width={70} height={24} borderRadius="full" />
          <Skeleton width={85} height={24} borderRadius="full" />
          <Skeleton width={65} height={24} borderRadius="full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton list - renders multiple skeleton items.
 *
 * @example
 * ```tsx
 * <SkeletonList count={6} renderItem={() => <SkeletonCafeCard />} />
 * ```
 */
export function SkeletonList({
  count = 3,
  renderItem,
  className = '',
  gap = '1rem',
}: {
  count?: number;
  renderItem: (index: number) => React.ReactNode;
  className?: string;
  gap?: string;
}) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderItem(index)}</React.Fragment>
      ))}
    </div>
  );
}

/**
 * Skeleton grid - renders skeleton items in a grid layout.
 *
 * @example
 * ```tsx
 * <SkeletonGrid count={6} columns={3} renderItem={() => <SkeletonCafeCard />} />
 * ```
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  renderItem,
  className = '',
  gap = '1.5rem',
}: {
  count?: number;
  columns?: number;
  renderItem: (index: number) => React.ReactNode;
  className?: string;
  gap?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{renderItem(index)}</React.Fragment>
      ))}
    </div>
  );
}

export default Skeleton;

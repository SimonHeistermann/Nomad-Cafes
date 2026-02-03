import React, { useState, useEffect, useCallback } from 'react';

const MAX_GALLERY_THUMBS = 6;

export type ListingGalleryProps = {
  mainImage: string;
  additionalImages: string[];
  name: string;
};

export const ListingGallery: React.FC<ListingGalleryProps> = ({
  mainImage,
  additionalImages,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allImages = [mainImage, ...additionalImages];
  const hasImages = allImages.length > 0;

  const openAt = (index: number) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) =>
      prev - 1 < 0 ? allImages.length - 1 : prev - 1,
    );
  }, [allImages.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, goNext, goPrev]);

  if (!hasImages) return null;

  const thumbsToShow = additionalImages.slice(0, MAX_GALLERY_THUMBS - 1);
  const remainingCount = additionalImages.length - thumbsToShow.length;

  return (
    <>
      <section className="listing-gallery">
        <div
          className="listing-gallery-main"
          onClick={() => openAt(0)}
          role="button"
          aria-label="Open gallery"
        >
          <img src={mainImage} alt={name} />
        </div>

        <div className="listing-gallery-grid">
          {thumbsToShow.map((src, index) => {
            const absoluteIndex = index + 1;
            const isLastVisible =
              index === thumbsToShow.length - 1 && remainingCount > 0;

            return (
              <button
                key={src}
                type="button"
                className="listing-gallery-thumb"
                onClick={() => openAt(absoluteIndex)}
              >
                <img src={src} alt={`${name} ${index + 2}`} />
                {isLastVisible && (
                  <div className="listing-gallery-more">
                    +{remainingCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {isOpen && (
        <div
          className="listing-gallery-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="listing-gallery-overlay-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="listing-gallery-overlay-close"
              onClick={close}
              aria-label="Close gallery"
            >
              ×
            </button>

            <button
              type="button"
              className="listing-gallery-overlay-arrow listing-gallery-overlay-arrow--left"
              onClick={goPrev}
              aria-label="Previous image"
            >
              ‹
            </button>

            <img
              src={allImages[activeIndex]}
              alt={`${name} gallery image`}
              className="listing-gallery-overlay-image"
            />

            <button
              type="button"
              className="listing-gallery-overlay-arrow listing-gallery-overlay-arrow--right"
              onClick={goNext}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
};
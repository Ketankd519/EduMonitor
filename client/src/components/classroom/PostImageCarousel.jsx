import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, FileText, Download, ImageOff } from 'lucide-react';

const isImageFile = (path) => {
  if (!path || typeof path !== 'string') return false;
  const clean = path.split('?')[0].toLowerCase();
  return /\.(jpe?g|png|webp|gif|svg|bmp|avif)$/i.test(clean);
};

export default function PostImageCarousel({ attachments = [], backendBase = '', onExpandImage }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter(isImageFile);
  const nonImages = attachments.filter((att) => !isImageFile(att));

  const hasMultipleImages = images.length > 1;

  const getFullSrc = (att) => {
    if (!att) return '';
    return att.startsWith('http') ? att : `${backendBase}${att}`;
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;
    if (diff > minSwipeDistance) {
      handleNext();
    } else if (diff < -minSwipeDistance) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleImageError = (idx) => {
    setBrokenImages((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="post-attachments-container">
      {/* Images Carousel */}
      {images.length > 0 && (
        <div
          className="post-carousel-wrapper"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Post image carousel"
          role="region"
        >
          <div className="post-carousel-stage">
            {/* Previous Arrow Button */}
            {hasMultipleImages && currentIndex > 0 && (
              <button
                type="button"
                className="post-carousel-nav-btn post-carousel-nav-prev"
                onClick={handlePrev}
                aria-label="Previous image"
                title="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Current Image Display */}
            <div className="post-carousel-slide">
              {brokenImages[currentIndex] ? (
                <div className="post-carousel-image-fallback">
                  <ImageOff size={36} />
                  <span>Unable to display image</span>
                </div>
              ) : (
                <img
                  src={getFullSrc(images[currentIndex])}
                  alt={`Post attachment ${currentIndex + 1} of ${images.length}`}
                  className="post-carousel-image"
                  loading="lazy"
                  onError={() => handleImageError(currentIndex)}
                  onClick={() => onExpandImage && onExpandImage(getFullSrc(images[currentIndex]))}
                  title="Click to expand image"
                />
              )}
            </div>

            {/* Next Arrow Button */}
            {hasMultipleImages && currentIndex < images.length - 1 && (
              <button
                type="button"
                className="post-carousel-nav-btn post-carousel-nav-next"
                onClick={handleNext}
                aria-label="Next image"
                title="Next image"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Pagination Indicators (only when multiple images) */}
          {hasMultipleImages && (
            <div className="post-carousel-pagination" role="tablist" aria-label="Image indicators">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentIndex}
                  aria-label={`Go to image ${idx + 1}`}
                  className={`post-carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Non-image Attachments (Documents, PDFs, etc.) */}
      {nonImages.length > 0 && (
        <div className="post-non-image-attachments">
          {nonImages.map((fileAtt, fIdx) => {
            const fileName = fileAtt.split('/').pop() || `Attachment ${fIdx + 1}`;
            const fileUrl = getFullSrc(fileAtt);
            return (
              <a
                key={fIdx}
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="post-file-chip"
                title={`Open ${fileName}`}
              >
                <FileText size={16} />
                <span className="post-file-name">{fileName}</span>
                <Download size={14} className="post-file-download-icon" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

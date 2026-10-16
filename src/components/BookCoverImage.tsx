import React, { useState, useEffect } from 'react';

interface BookCoverImageProps {
  src?: string | null;
  bookId?: string;
  alt: string;
  className?: string;
  title?: string;
}

export const BookCoverImage: React.FC<BookCoverImageProps> = ({
  src,
  bookId,
  alt,
  className = 'w-full h-full object-cover',
  title,
}) => {
  // Determine preferred local cover if bookId is available
  const localCover = bookId ? `/covers/${bookId}.svg` : '/covers/default.svg';
  
  // Initial source
  const initialSource = src && src.trim() !== '' ? src : localCover;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSource);
  const [fallbackLevel, setFallbackLevel] = useState<number>(0);

  useEffect(() => {
    const nextSrc = src && src.trim() !== '' ? src : localCover;
    setCurrentSrc(nextSrc);
    setFallbackLevel(0);
  }, [src, bookId]);

  const handleError = () => {
    if (fallbackLevel === 0 && currentSrc !== localCover) {
      // Step 1 fallback: Try local SVG for this specific book
      setFallbackLevel(1);
      setCurrentSrc(localCover);
    } else if (fallbackLevel <= 1 && currentSrc !== '/covers/default.svg') {
      // Step 2 fallback: Try default SVG cover
      setFallbackLevel(2);
      setCurrentSrc('/covers/default.svg');
    } else {
      // Step 3: Inline SVG Data URI guaranteed to render anywhere
      setFallbackLevel(3);
      const safeTitle = (title || alt || 'Sách').replace(/[<>&"]/g, '');
      const inlineSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="100%" stop-color="#3b82f6"/>
            </linearGradient>
          </defs>
          <rect width="200" height="280" rx="8" fill="url(#bg)"/>
          <rect x="0" y="0" width="16" height="280" fill="rgba(255,255,255,0.15)"/>
          <text x="100" y="130" fill="#ffffff" font-size="14" font-weight="bold" font-family="sans-serif" text-anchor="middle">${safeTitle.slice(0, 20)}</text>
          <text x="100" y="155" fill="#93c5fd" font-size="10" font-family="sans-serif" text-anchor="middle">TUẤN VIỆT LIBRARY</text>
        </svg>`
      )}`;
      setCurrentSrc(inlineSvg);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
      loading="lazy"
    />
  );
};

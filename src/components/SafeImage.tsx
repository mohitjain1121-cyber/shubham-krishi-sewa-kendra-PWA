import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { ImageStorageService } from '../services/db';
import { getProductImageUrl } from '../config/r2';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  brand?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className = '', brand = 'Agro' }) => {
  // Resolve image source using centralized helper first (resolves R2 paths to absolute URLs)
  const resolvedImageSrc = getProductImageUrl(src);

  const isDirectUrl = (url: string): boolean => {
    if (!url) return false;
    return (
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('data:') ||
      url.startsWith('/') ||
      url.startsWith('./') ||
      url.startsWith('../')
    );
  };

  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    return isDirectUrl(resolvedImageSrc) ? resolvedImageSrc : '';
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    
    if (!resolvedImageSrc) {
      setResolvedSrc('');
      return;
    }
    
    // Check if resolvedImageSrc is directly loadable
    if (isDirectUrl(resolvedImageSrc)) {
      setResolvedSrc(resolvedImageSrc);
      setHasError(false);
      return;
    }
    
    // Retrieve from IndexedDB locally
    ImageStorageService.getImageAsDataUrl(resolvedImageSrc)
      .then(dataUrl => {
        if (active) {
          if (dataUrl) {
            setResolvedSrc(dataUrl);
            setHasError(false);
          } else {
            setHasError(true);
          }
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [resolvedImageSrc]);

  if (hasError || !src || !resolvedSrc) {
    return (
      <div className={`bg-gradient-to-br from-green-50 to-emerald-100 text-green-700 flex flex-col items-center justify-center p-2 text-center select-none font-sans ${className}`}>
        <Leaf className="w-1/3 h-1/3 min-w-[16px] min-h-[16px] max-w-[40px] max-h-[40px] text-green-500 mb-1 opacity-70" />
        <span className="text-[8px] font-extrabold uppercase tracking-wider text-green-800/80 truncate max-w-full">
          {brand}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

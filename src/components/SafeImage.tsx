import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import { ImageStorageService } from '../services/db';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  brand?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, alt, className = '', brand = 'Agro' }) => {
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
    return isDirectUrl(src) ? src : '';
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    
    if (!src) {
      setResolvedSrc('');
      return;
    }
    
    // Check if src is directly loadable
    if (isDirectUrl(src)) {
      setResolvedSrc(src);
      setHasError(false);
      return;
    }
    
    // Retrieve from IndexedDB locally
    ImageStorageService.getImageAsDataUrl(src)
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
  }, [src]);

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

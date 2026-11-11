/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Dish Image Component
 * Loads compressed photos lazily from the images document store.
 */

import React, { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface DishImageProps {
  photo?: string;
  alt: string;
  className?: string;
}

export const DishImage: React.FC<DishImageProps> = ({ photo, alt, className = 'w-full h-full object-cover' }) => {
  const { loadImage } = useStore();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) {
      setSrc(null);
      return;
    }

    if (photo.startsWith('data:') || photo.startsWith('http')) {
      setSrc(photo);
      return;
    }

    // Load from image document store
    let isMounted = true;
    loadImage(photo).then((dataUrl) => {
      if (isMounted) {
        setSrc(dataUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [photo, loadImage]);

  if (!src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-neutral-100 text-neutral-400">
        <UtensilsCrossed className="w-6 h-6 mb-1 text-amber-500/70" />
        <span className="text-[10px] text-neutral-400 font-medium">KinD</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};

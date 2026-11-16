import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  style,
  fallbackLabel = 'VYRO',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-[#0B0E17] to-zinc-950 text-zinc-400 select-none ${className}`}
        style={style}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-6 h-6 text-rose-500 mb-2" aria-hidden="true" />
        <span className="font-display text-sm font-bold tracking-widest uppercase text-zinc-300">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      style={style}
    />
  );
};

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export default function ImageWithLoading({ src, alt, className, onClick }: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`image-with-loading-container ${className || ''}`} onClick={onClick}>
      {isLoading && !hasError && (
        <div className="image-loading">
          <Loader2 size={24} className="spinner" />
        </div>
      )}
      {hasError && (
        <div className="image-error">
          <span>Failed to load</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${isLoading ? 'image-loading-hidden' : 'image-loaded'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        style={{ display: hasError ? 'none' : undefined }}
      />
    </div>
  );
}

import { useState } from 'react';

// Lazy-loaded image that degrades to a neutral block when missing or broken
export default function SmartImage({ src, alt, className = '', ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return <div role="img" aria-label={alt} className={`bg-brown-600/15 ${className}`} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
      {...props}
    />
  );
}
